import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceMember } from '@/lib/permissions';
import { VALID_STATUSES, VALID_PRIORITIES } from '@/lib/permissions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIp(request);
    const limiter = rateLimit({ ip: `import_export_${ip}`, limit: 15, windowMs: 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json({ error: 'Rate limit exceeded for import/export operations.' }, { status: 429 });
    }

    const body = await request.json();
    const { action, projectId, workspaceId, taskData } = body;

    if (action === 'IMPORT_TASKS') {
      if (!projectId || !Array.isArray(taskData)) {
        return NextResponse.json({ error: 'Project ID and valid task array required' }, { status: 400 });
      }

      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const member = await requireWorkspaceMember(project.workspaceId, user.id);
      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const created = [];
      const validationErrors = [];

      for (let i = 0; i < taskData.length; i++) {
        const t = taskData[i];
        if (!t || typeof t !== 'object') continue;

        const title = (t.title || '').toString().trim();
        if (!title) {
          validationErrors.push(`Row ${i + 1}: Missing task title`);
          continue;
        }

        const status = (t.status || 'TODO').toString().toUpperCase();
        const finalStatus = VALID_STATUSES.includes(status) ? status : 'TODO';

        const priority = (t.priority || 'MEDIUM').toString().toUpperCase();
        const finalPriority = VALID_PRIORITIES.includes(priority) ? priority : 'MEDIUM';

        const description = (t.description || 'Imported item').toString().slice(0, 5000);

        const task = await db.task.create({
          data: {
            projectId,
            title,
            description,
            status: finalStatus,
            priority: finalPriority,
            creatorId: user.id,
          },
        });
        created.push(task);
      }

      return NextResponse.json({
        success: true,
        count: created.length,
        errors: validationErrors,
      });
    }

    if (action === 'EXPORT_WORKSPACE') {
      if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
      }

      const member = await requireWorkspaceMember(workspaceId, user.id);
      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          projects: {
            include: {
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  priority: true,
                  dueDate: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          members: {
            select: {
              id: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          docs: {
            select: {
              id: true,
              title: true,
              category: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          goals: {
            include: {
              keyResults: true,
            },
          },
        },
      });

      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        workspaceBackup: workspace,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Import/Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
