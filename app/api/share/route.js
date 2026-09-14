import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceMember } from '@/lib/permissions';
import { generateSecureToken, hashToken } from '@/lib/security';

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId, expiresDays } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(project.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate cryptographically secure token & hash
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    let expiresAt = null;
    if (expiresDays && Number(expiresDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000);
    }

    const shareLink = await db.shareLink.create({
      data: {
        projectId,
        token: rawToken,
        tokenHash,
        createdById: user.id,
        expiresAt,
      },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${origin}/share/${rawToken}`;

    return NextResponse.json({
      success: true,
      id: shareLink.id,
      token: rawToken,
      shareUrl,
      expiresAt: shareLink.expiresAt,
      createdAt: shareLink.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const shareLinkId = searchParams.get('id');

    if (!shareLinkId) {
      return NextResponse.json({ error: 'Share link ID required' }, { status: 400 });
    }

    const shareLink = await db.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { project: true },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(shareLink.project.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.shareLink.update({
      where: { id: shareLinkId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Share link revoked' });
  } catch (error) {
    console.error('Revoke share link error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
