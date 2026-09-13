import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        tasks: {
          include: {
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
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      project: {
        ...project,
        totalTasks,
        completedTasks,
        progress,
      },
    });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, description, status, color } = await req.json();

    const updated = await db.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(color && { color }),
      },
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
