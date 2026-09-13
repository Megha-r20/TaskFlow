import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { broadcastEvent } from '@/lib/events';

export async function GET(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');

    const where = {};

    if (projectId) {
      where.projectId = projectId;
    } else if (workspaceId) {
      where.project = { workspaceId };
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      projectId,
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      dueDate,
      assigneeId,
      labelIds = [],
    } = await req.json();

    if (!projectId || !title || !title.trim()) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true, name: true, key: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get max order
    const maxOrderTask = await db.task.findFirst({
      where: { projectId, status },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (maxOrderTask?.order ?? -1) + 1;

    const task = await db.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          projectId,
          title: title.trim(),
          description: description?.trim() || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          order,
          creatorId: user.id,
          assigneeId: assigneeId || null,
          labels: {
            create: labelIds.map((labelId) => ({ labelId })),
          },
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: project.workspaceId,
          projectId: project.id,
          taskId: newTask.id,
          userId: user.id,
          action: 'CREATED_TASK',
          details: `Created task "${title.trim()}" in ${project.name}`,
        },
      });

      if (assigneeId && assigneeId !== user.id) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `${user.name} assigned you to "${title.trim()}"`,
            linkUrl: `/projects/${projectId}?task=${newTask.id}`,
          },
        });
      }

      return newTask;
    });

    broadcastEvent('TASK_CREATED', { task, workspaceId: project.workspaceId });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
