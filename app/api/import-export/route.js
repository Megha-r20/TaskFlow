import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, projectId, workspaceId, taskData } = body;

    if (action === 'IMPORT_TASKS') {
      if (!projectId || !Array.isArray(taskData)) {
        return NextResponse.json({ error: 'Project ID and valid task array required' }, { status: 400 });
      }

      // Bulk create tasks
      const created = [];
      for (const t of taskData) {
        if (!t.title) continue;
        const task = await db.task.create({
          data: {
            projectId,
            title: t.title,
            description: t.description || 'Imported via CSV/JSON',
            status: t.status || 'TODO',
            priority: t.priority || 'MEDIUM',
            creatorId: user.id,
          },
        });
        created.push(task);
      }

      return NextResponse.json({ success: true, count: created.length });
    }

    if (action === 'EXPORT_WORKSPACE') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
      }

      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          projects: {
            include: {
              tasks: true,
            },
          },
          members: {
            include: { user: true },
          },
        },
      });

      return NextResponse.json({ workspaceBackup: workspace });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Import/Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
