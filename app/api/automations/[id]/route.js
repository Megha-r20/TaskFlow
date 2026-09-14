import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceAdmin } from '@/lib/permissions';

export async function PATCH(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rule = await db.automationRule.findUnique({ where: { id } });
    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    const adminMember = await requireWorkspaceAdmin(rule.workspaceId, user.id);
    if (!adminMember) {
      return NextResponse.json({ error: 'Forbidden: Only Workspace Admins and Owners can modify automation rules' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.automationRule.update({
      where: { id },
      data: {
        ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
        ...(body.name ? { name: body.name } : {}),
      },
    });

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error('Update automation rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const rule = await db.automationRule.findUnique({ where: { id } });
    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    const adminMember = await requireWorkspaceAdmin(rule.workspaceId, user.id);
    if (!adminMember) {
      return NextResponse.json({ error: 'Forbidden: Only Workspace Admins and Owners can delete automation rules' }, { status: 403 });
    }

    await db.automationRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete automation rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
