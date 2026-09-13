import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberships = await db.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      description: m.workspace.description,
      role: m.role,
      memberCount: m.workspace._count.members,
      projectCount: m.workspace._count.projects,
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Fetch workspaces error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const workspace = await db.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          ownerId: user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // Default labels
      await tx.label.createMany({
        data: [
          { workspaceId: ws.id, name: 'Frontend', color: '#3b82f6' },
          { workspaceId: ws.id, name: 'Backend', color: '#8b5cf6' },
          { workspaceId: ws.id, name: 'UI/UX', color: '#ec4899' },
          { workspaceId: ws.id, name: 'Bug', color: '#ef4444' },
        ],
      });

      return ws;
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
