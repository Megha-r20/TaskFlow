import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceMember } from '@/lib/permissions';
import { createProjectSchema, validateBody } from '@/lib/validations';

export async function GET(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID parameter is required' }, { status: 400 });
    }

    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projects = await db.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
        tasks: {
          select: {
            status: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProjects = projects.map((p) => {
      const totalTasks = p._count.tasks;
      const completedTasks = p.tasks.filter((t) => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        color: p.color,
        createdAt: p.createdAt,
        totalTasks,
        completedTasks,
        progress,
        memberCount: p._count.members,
        members: p.members.map((m) => m.user),
      };
    });

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { error, data } = validateBody(createProjectSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const member = await requireWorkspaceMember(data.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formattedKey = data.key.trim().toUpperCase().slice(0, 10);

    const project = await db.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          workspaceId: data.workspaceId,
          name: data.name.trim(),
          key: formattedKey,
          description: data.description?.trim() || null,
          color: data.color || '#6366f1',
          status: 'ACTIVE',
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: p.id,
          userId: user.id,
          role: 'LEAD',
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: data.workspaceId,
          projectId: p.id,
          userId: user.id,
          action: 'CREATED_PROJECT',
          details: `Created new project "${data.name.trim()}" (${formattedKey})`,
        },
      });

      return p;
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A project with this key already exists in the workspace' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
