import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { broadcastEvent, EVENT_TYPES } from '@/lib/events';

export async function GET(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
            workspaceId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Fetch task detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, description, status, priority, dueDate, assigneeId, order, labelIds } = body;

    const existingTask = await db.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await db.$transaction(async (tx) => {
      // Update label associations if provided
      if (Array.isArray(labelIds)) {
        await tx.taskLabel.deleteMany({ where: { taskId: id } });
        if (labelIds.length > 0) {
          await tx.taskLabel.createMany({
            data: labelIds.map((labelId) => ({ taskId: id, labelId })),
          });
        }
      }

      const t = await tx.task.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
          ...(order !== undefined && { order }),
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true, workspaceId: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
      });

      // Track activity log changes
      let actionDetails = '';
      if (status && status !== existingTask.status) {
        actionDetails = `Changed status from ${existingTask.status} to ${status}`;
      } else if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
        actionDetails = assigneeId ? `Assigned task to new member` : `Unassigned task`;
      } else if (title && title !== existingTask.title) {
        actionDetails = `Updated task title`;
      }

      if (actionDetails) {
        await tx.activityLog.create({
          data: {
            workspaceId: existingTask.project.workspaceId,
            projectId: existingTask.projectId,
            taskId: id,
            userId: user.id,
            action: status ? 'UPDATED_STATUS' : 'UPDATED_TASK',
            details: `${user.name}: ${actionDetails} for "${t.title}"`,
          },
        });
      }

      // Notify assigned user if newly assigned
      if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== user.id) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'Task Assigned',
            message: `${user.name} assigned you to task "${t.title}"`,
            linkUrl: `/projects/${t.projectId}?task=${id}`,
          },
        });
      }

      return t;
    });

    broadcastEvent(EVENT_TYPES.TASK_UPDATED, { task: updatedTask, workspaceId: updatedTask.project.workspaceId });

    // If someone was newly assigned, notify via SSE too
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== user.id) {
      broadcastEvent(EVENT_TYPES.NOTIFICATION, {
        userId: assigneeId,
        workspaceId: updatedTask.project.workspaceId,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.task.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        projectId: task.projectId,
        userId: user.id,
        action: 'DELETED_TASK',
        details: `Deleted task "${task.title}"`,
      },
    });

    broadcastEvent(EVENT_TYPES.TASK_DELETED, { taskId: id, workspaceId: task.project.workspaceId });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
