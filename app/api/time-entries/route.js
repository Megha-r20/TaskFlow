import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const initialEntries = [
      {
        id: 'te-1',
        taskTitle: 'Implement WebRTC Huddle Controls',
        projectName: 'Frontend Platform',
        user: user.name,
        avatarUrl: user.avatarUrl,
        durationMinutes: 145,
        hourlyRate: 75,
        billable: true,
        date: new Date().toLocaleDateString(),
      },
      {
        id: 'te-2',
        taskTitle: 'Refactor Workspace SSE Real-Time Stream',
        projectName: 'Backend Infra',
        user: user.name,
        avatarUrl: user.avatarUrl,
        durationMinutes: 90,
        hourlyRate: 85,
        billable: true,
        date: new Date().toLocaleDateString(),
      },
    ];

    return NextResponse.json({ timeEntries: initialEntries });
  } catch (error) {
    console.error('Fetch time entries error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { taskTitle, projectName, durationMinutes, hourlyRate, billable } = body;

    const newEntry = {
      id: `te-${Date.now()}`,
      taskTitle: taskTitle || 'General Task',
      projectName: projectName || 'General Project',
      user: user.name,
      avatarUrl: user.avatarUrl,
      durationMinutes: Number(durationMinutes) || 30,
      hourlyRate: Number(hourlyRate) || 75,
      billable: Boolean(billable),
      date: new Date().toLocaleDateString(),
    };

    return NextResponse.json({ timeEntry: newEntry });
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
