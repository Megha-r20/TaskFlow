import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceMember } from '@/lib/permissions';
import { createTimeEntrySchema, validateBody } from '@/lib/validations';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let entries = await db.timeEntry.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Seed default initial entries if none exist yet for the workspace
    if (entries.length === 0) {
      const todayStr = new Date().toLocaleDateString();
      await db.timeEntry.createMany({
        data: [
          {
            workspaceId,
            userId: user.id,
            taskTitle: 'Implement WebRTC Huddle Controls',
            projectName: 'Frontend Platform',
            durationMinutes: 145,
            hourlyRate: 75,
            billable: true,
            date: todayStr,
          },
          {
            workspaceId,
            userId: user.id,
            taskTitle: 'Refactor Workspace SSE Real-Time Stream',
            projectName: 'Backend Infra',
            durationMinutes: 90,
            hourlyRate: 85,
            billable: true,
            date: todayStr,
          },
        ],
      });

      entries = await db.timeEntry.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const formattedEntries = entries.map((e) => ({
      id: e.id,
      taskTitle: e.taskTitle,
      projectName: e.projectName,
      user: e.user.name,
      userId: e.userId,
      avatarUrl: e.user.avatarUrl,
      durationMinutes: e.durationMinutes,
      hourlyRate: e.hourlyRate,
      billable: e.billable,
      date: e.date,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ timeEntries: formattedEntries });
  } catch (error) {
    console.error('Fetch time entries error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { error, data } = validateBody(createTimeEntrySchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const member = await requireWorkspaceMember(data.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const todayStr = new Date().toLocaleDateString();
    const entry = await db.timeEntry.create({
      data: {
        workspaceId: data.workspaceId,
        userId: user.id,
        taskId: data.taskId || null,
        taskTitle: data.taskTitle,
        projectName: data.projectName,
        durationMinutes: data.durationMinutes,
        hourlyRate: data.hourlyRate,
        billable: data.billable,
        date: todayStr,
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      timeEntry: {
        id: entry.id,
        taskTitle: entry.taskTitle,
        projectName: entry.projectName,
        user: entry.user.name,
        userId: entry.userId,
        avatarUrl: entry.user.avatarUrl,
        durationMinutes: entry.durationMinutes,
        hourlyRate: entry.hourlyRate,
        billable: entry.billable,
        date: entry.date,
      },
    });
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Time entry ID required' }, { status: 400 });
    }

    const entry = await db.timeEntry.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(entry.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete time entry error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
