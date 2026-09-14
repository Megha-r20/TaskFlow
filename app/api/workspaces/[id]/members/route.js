import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateSecureToken, hashToken } from '@/lib/security';
import { requireWorkspaceAdmin } from '@/lib/permissions';

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
    const body = await req.json();
    const { email, role = 'MEMBER' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 });
    }

    const adminCheck = await requireWorkspaceAdmin(workspaceId, user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (targetUser) {
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
          role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      const ws = await db.workspace.findUnique({ where: { id: workspaceId } });
      await db.notification.create({
        data: {
          userId: targetUser.id,
          type: 'INVITATION',
          title: 'Joined Workspace',
          message: `You were added to ${ws?.name || 'the workspace'} as a ${role}`,
          linkUrl: `/dashboard?workspace=${workspaceId}`,
        },
      });

      return NextResponse.json({ member: newMember }, { status: 201 });
    }

    // Cryptographically secure invitation token & hash
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.invitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        token: rawToken,
        tokenHash,
        expiresAt,
        status: 'PENDING',
      },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${origin}/invite/${rawToken}`;

    return NextResponse.json(
      {
        message: 'Invitation created successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: rawToken,
          inviteUrl,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
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

    const adminCheck = await requireWorkspaceAdmin(workspaceId, user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Only owners and admins can update member roles' }, { status: 403 });
    }

    const updated = await db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}
