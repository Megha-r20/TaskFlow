import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = params.id;

    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true, projects: true },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        description: membership.workspace.description,
        createdAt: membership.workspace.createdAt,
        ownerId: membership.workspace.ownerId,
        memberCount: membership.workspace._count.members,
        projectCount: membership.workspace._count.projects,
        userRole: membership.role,
      },
    });
  } catch (error) {
    console.error('Fetch workspace details error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace details' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = params.id;

    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Role Enforcement: Only OWNER or ADMIN can edit workspace settings
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Workspace Owners and Admins can update workspace settings.' },
        { status: 403 }
      );
    }

    const { name, description } = await req.json();

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Workspace name cannot be empty' }, { status: 400 });
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: 'Workspace name cannot exceed 100 characters' }, { status: 400 });
      }
    }

    const updatedWorkspace = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({ workspace: updatedWorkspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    return NextResponse.json({ error: 'Failed to update workspace settings' }, { status: 500 });
  }
}
