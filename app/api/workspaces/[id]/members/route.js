import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workspaceId } = await params;

    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace members' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workspaceId } = await params;
    const { email, role = 'MEMBER' } = await req.json();

    const currentMember = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!currentMember || (currentMember.role !== 'OWNER' && currentMember.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    const targetUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      // Create invitation token entry
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const invitation = await db.invitation.create({
        data: {
          workspaceId,
          email: email.toLowerCase().trim(),
          role,
          token,
        },
      });
      return NextResponse.json({ message: 'Invitation sent successfully', invitation }, { status: 201 });
    }

    const existingMember = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
    }

    const newMember = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notify target user
    const ws = await db.workspace.findUnique({ where: { id: workspaceId } });
    await db.notification.create({
      data: {
        userId: targetUser.id,
        type: 'INVITATION',
        title: 'Joined Workspace',
        message: `You were added to ${ws.name} as a ${role}`,
        linkUrl: `/dashboard?workspace=${workspaceId}`,
      },
    });

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workspaceId } = await params;
    const { userId, role } = await req.json();

    const currentMember = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!currentMember || (currentMember.role !== 'OWNER' && currentMember.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Only owners and admins can update member roles' }, { status: 403 });
    }

    const updated = await db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}
