import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationIds, markAllRead } = await req.json();

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await db.notification.updateMany({
        where: { id: { in: notificationIds }, userId: user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: 'Notifications updated' });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
