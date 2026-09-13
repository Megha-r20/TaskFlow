import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const activityLogs = await db.activityLog.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, key: true, color: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ activityLogs });
  } catch (error) {
    console.error('Fetch activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
