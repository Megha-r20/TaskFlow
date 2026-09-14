import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceMember, requireWorkspaceAdmin } from '@/lib/permissions';

export async function GET(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const rules = await db.automationRule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const isAdminOrOwner = member.role === 'ADMIN' || member.role === 'OWNER';

    return NextResponse.json({ rules, userRole: member.role, canManage: isAdminOrOwner });
  } catch (error) {
    console.error('Fetch automations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspaceId, name, triggerType, triggerValue, actionType, actionValue } = await req.json();

    if (!workspaceId || !name || !triggerType || !triggerValue || !actionType || !actionValue) {
      return NextResponse.json({ error: 'Missing required rule parameters' }, { status: 400 });
    }

    // Require OWNER or ADMIN role to create automation rules
    const adminMember = await requireWorkspaceAdmin(workspaceId, user.id);
    if (!adminMember) {
      return NextResponse.json({ error: 'Forbidden: Only Workspace Admins and Owners can create automation rules' }, { status: 403 });
    }

    const rule = await db.automationRule.create({
      data: {
        workspaceId,
        name,
        triggerType,
        triggerValue,
        actionType,
        actionValue,
        enabled: true,
      },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        workspaceId,
        userId: user.id,
        action: 'AUTOMATION_RULE_CREATED',
        details: `Created automation rule "${name}"`,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Create automation rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
