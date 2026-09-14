import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const initialGoals = [
      {
        id: 'goal-1',
        title: '🎯 Launch TaskFlow Pro V2.0 Platform',
        quarter: 'Q3 2026',
        owner: user.name,
        targetProgress: 100,
        currentProgress: 85,
        keyResults: [
          { id: 'kr-1', title: 'Complete WebRTC Huddle & Meeting Room Integration', current: 100, target: 100, unit: '%' },
          { id: 'kr-2', title: 'Deliver 5 Pro Tools (Focus Mode, Gantt, Whiteboard, Workload, Automations)', current: 100, target: 100, unit: '%' },
          { id: 'kr-3', title: 'Onboard 50 Active Workspace Teammates', current: 35, target: 50, unit: 'users' },
        ],
      },
      {
        id: 'goal-2',
        title: '⚡ Achieve 99.9% Real-Time System Reliability',
        quarter: 'Q3 2026',
        owner: 'Engineering Team',
        targetProgress: 100,
        currentProgress: 92,
        keyResults: [
          { id: 'kr-4', title: 'Maintain Server-Sent Events (SSE) stream uptime', current: 99.9, target: 99.9, unit: '%' },
          { id: 'kr-5', title: 'Sub-50ms API response latency across all endpoints', current: 42, target: 50, unit: 'ms' },
        ],
      },
    ];

    return NextResponse.json({ goals: initialGoals });
  } catch (error) {
    console.error('Fetch goals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, quarter, keyResults } = body;

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: title || 'New Objective',
      quarter: quarter || 'Q3 2026',
      owner: user.name,
      targetProgress: 100,
      currentProgress: 0,
      keyResults: keyResults || [],
    };

    return NextResponse.json({ goal: newGoal });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
