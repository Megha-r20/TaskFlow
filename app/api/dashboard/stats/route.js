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

    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      overdueTasks,
      myAssignedTasks,
      recentActivity,
      upcomingDeadlines,
    ] = await Promise.all([
      db.project.count({ where: { workspaceId } }),
      db.task.count({ where: { project: { workspaceId } } }),
      db.task.count({ where: { project: { workspaceId }, status: 'DONE' } }),
      db.task.count({ where: { project: { workspaceId }, status: 'TODO' } }),
      db.task.count({ where: { project: { workspaceId }, status: 'IN_PROGRESS' } }),
      db.task.count({ where: { project: { workspaceId }, status: 'REVIEW' } }),
      db.task.count({
        where: {
          project: { workspaceId },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      db.task.count({
        where: {
          project: { workspaceId },
          assigneeId: user.id,
          status: { not: 'DONE' },
        },
      }),
      db.activityLog.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, name: true, key: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.task.findMany({
        where: {
          project: { workspaceId },
          dueDate: { gte: now },
          status: { not: 'DONE' },
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ]);

    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        todoTasks,
        inProgressTasks,
        reviewTasks,
        overdueTasks,
        myAssignedTasks,
        completionRate,
      },
      recentActivity,
      upcomingDeadlines,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
