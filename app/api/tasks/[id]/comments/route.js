import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceMember } from '@/lib/permissions';
import { broadcastEvent, EVENT_TYPES } from '@/lib/events';

export async function GET(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: taskId } = await params;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(task.project.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const comments = await db.comment.findMany({
      where: { taskId },
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
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: taskId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Comment content must be 5000 characters or less' }, { status: 400 });
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(task.project.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const comment = await db.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          taskId,
          userId: user.id,
          content: content.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          workspaceId: task.project.workspaceId,
          projectId: task.projectId,
          taskId,
          userId: user.id,
          action: 'COMMENTED',
          details: `Commented on "${task.title}"`,
        },
      });

      // Parse @mentions
      const mentionMatches = content.match(/@([A-Za-z0-9_\s]+?)(?=\s|$|[.,!?])/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const mentionedNames = mentionMatches.map((m) => m.replace('@', '').trim());
        const workspaceUsers = await tx.workspaceMember.findMany({
          where: { workspaceId: task.project.workspaceId },
          include: { user: true },
        });

        for (const wm of workspaceUsers) {
          if (
            wm.user.id !== user.id &&
            mentionedNames.some((n) => wm.user.name.toLowerCase().includes(n.toLowerCase()))
          ) {
            await tx.notification.create({
              data: {
                userId: wm.user.id,
                type: 'MENTIONED',
                title: 'Mentioned in comment',
                message: `${user.name} mentioned you in task "${task.title}"`,
                linkUrl: `/projects/${task.projectId}?task=${task.id}`,
              },
            });
          }
        }
      }

      return c;
    });

    // Broadcast new comment to all workspace subscribers
    broadcastEvent(EVENT_TYPES.COMMENT_ADDED, {
      comment,
      taskId,
      workspaceId: task.project.workspaceId,
    });

    // Broadcast NOTIFICATION event for mentions (so notification bell updates instantly)
    const mentionMatches2 = content.match(/@([A-Za-z0-9_\s]+?)(?=\s|$|[.,!?])/g);
    if (mentionMatches2) {
      broadcastEvent(EVENT_TYPES.NOTIFICATION, { workspaceId: task.project.workspaceId });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
