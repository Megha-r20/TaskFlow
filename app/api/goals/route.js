import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceMember } from '@/lib/permissions';
import { createGoalSchema, validateBody } from '@/lib/validations';

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

    let goals = await db.goal.findMany({
      where: { workspaceId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        keyResults: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Seed default goals if workspace has none
    if (goals.length === 0) {
      await db.goal.create({
        data: {
          workspaceId,
          ownerId: user.id,
          title: '🎯 Launch TaskFlow Pro V2.0 Platform',
          quarter: 'Q3 2026',
          targetProgress: 100,
          currentProgress: 85,
          keyResults: {
            create: [
              { title: 'Complete WebRTC Huddle & Meeting Room Integration', current: 100, target: 100, unit: '%' },
              { title: 'Deliver 5 Pro Tools (Focus Mode, Gantt, Whiteboard, Workload, Automations)', current: 100, target: 100, unit: '%' },
              { title: 'Onboard 50 Active Workspace Teammates', current: 35, target: 50, unit: 'users' },
            ],
          },
        },
      });

      goals = await db.goal.findMany({
        where: { workspaceId },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          keyResults: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const formattedGoals = goals.map((goal) => {
      // Calculate progress dynamically based on Key Results
      let totalProgress = goal.currentProgress;
      if (goal.keyResults.length > 0) {
        const sumPercentage = goal.keyResults.reduce((acc, kr) => {
          const percentage = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0;
          return acc + percentage;
        }, 0);
        totalProgress = Math.round(sumPercentage / goal.keyResults.length);
      }

      return {
        id: goal.id,
        title: goal.title,
        quarter: goal.quarter,
        owner: goal.owner.name,
        targetProgress: goal.targetProgress,
        currentProgress: totalProgress,
        keyResults: goal.keyResults.map((kr) => ({
          id: kr.id,
          title: kr.title,
          current: kr.current,
          target: kr.target,
          unit: kr.unit,
        })),
        createdAt: goal.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ goals: formattedGoals });
  } catch (error) {
    console.error('Fetch goals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { error, data } = validateBody(createGoalSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const member = await requireWorkspaceMember(data.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const goal = await db.goal.create({
      data: {
        workspaceId: data.workspaceId,
        ownerId: user.id,
        title: data.title,
        quarter: data.quarter,
        targetProgress: 100,
        currentProgress: 0,
        keyResults: {
          create: (data.keyResults || []).map((kr) => ({
            title: kr.title,
            current: kr.current || 0,
            target: kr.target || 100,
            unit: kr.unit || '%',
          })),
        },
      },
      include: {
        owner: { select: { name: true } },
        keyResults: true,
      },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        title: goal.title,
        quarter: goal.quarter,
        owner: goal.owner.name,
        targetProgress: goal.targetProgress,
        currentProgress: goal.currentProgress,
        keyResults: goal.keyResults,
      },
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, title, currentProgress, keyResultUpdates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    const goal = await db.goal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(goal.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (Array.isArray(keyResultUpdates)) {
      for (const kr of keyResultUpdates) {
        if (kr.id) {
          await db.keyResult.update({
            where: { id: kr.id },
            data: {
              ...(kr.current !== undefined && { current: kr.current }),
              ...(kr.target !== undefined && { target: kr.target }),
              ...(kr.title !== undefined && { title: kr.title }),
            },
          });
        }
      }
    }

    const updatedGoal = await db.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(currentProgress !== undefined && { currentProgress }),
      },
      include: {
        owner: { select: { name: true } },
        keyResults: true,
      },
    });

    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Update goal error:', error);
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
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    const goal = await db.goal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(goal.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
