import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSession();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        workspaces: user.workspaceMembers.map((wm) => ({
          id: wm.workspace.id,
          name: wm.workspace.name,
          slug: wm.workspace.slug,
          role: wm.role,
        })),
      },
    });
  } catch (error) {
    console.error('Me auth route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
