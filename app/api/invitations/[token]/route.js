import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hashToken } from '@/lib/security';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const hashed = hashToken(token);
    const invitation = await db.invitation.findFirst({
      where: {
        OR: [{ tokenHash: hashed }, { token: token }],
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation link' }, { status: 404 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'This invitation has already been accepted' }, { status: 400 });
    }

    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ error: 'This invitation link has expired' }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        workspaceName: invitation.workspace.name,
        workspaceId: invitation.workspace.id,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Fetch invitation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });

    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const hashed = hashToken(token);
    const invitation = await db.invitation.findFirst({
      where: {
        OR: [{ tokenHash: hashed }, { token: token }],
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    }

    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!existingMember) {
      await db.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
        },
      });
    }

    // Update invitation status
    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace invitation accepted successfully',
      workspaceId: invitation.workspaceId,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
