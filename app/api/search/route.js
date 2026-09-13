import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceMember } from '@/lib/permissions';

export async function GET(req) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const workspaceId = searchParams.get('workspaceId');

    if (!q || !q.trim() || !workspaceId) {
      return NextResponse.json({ projects: [], tasks: [], members: [] });
    }

    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const query = q.trim();

    const [projects, tasks, members] = await Promise.all([
      db.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: query } },
            { key: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
      }),
      db.task.findMany({
        where: {
          project: { workspaceId },
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        take: 10,
      }),
      db.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      projects,
      tasks,
      members: members.map((m) => ({ ...m.user, role: m.role })),
    });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
