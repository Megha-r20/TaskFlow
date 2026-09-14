import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/security';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const hashed = hashToken(token);

    // Look up share link by hash or token
    const shareLink = await db.shareLink.findFirst({
      where: {
        OR: [{ tokenHash: hashed }, { token: token }],
      },
      include: {
        project: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 });
    }

    if (shareLink.revokedAt) {
      return NextResponse.json({ error: 'This share link has been revoked' }, { status: 410 });
    }

    if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 });
    }

    const project = shareLink.project;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        status: project.status,
        color: project.color,
        createdAt: project.createdAt.toISOString(),
        tasks: project.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          assignee: t.assignee ? { name: t.assignee.name, avatarUrl: t.assignee.avatarUrl } : null,
        })),
      },
      readOnly: true,
    });
  } catch (error) {
    console.error('Fetch public share project error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
