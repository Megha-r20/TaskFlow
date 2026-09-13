import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, password, workspaceName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const formattedEmail = email.toLowerCase().trim();
    const defaultWsName = workspaceName?.trim() || `${name}'s Workspace`;
    const slug = defaultWsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: formattedEmail,
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      });

      const newWorkspace = await tx.workspace.create({
        data: {
          name: defaultWsName,
          slug,
          ownerId: newUser.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: newUser.id,
          role: 'OWNER',
        },
      });

      // Default labels
      await tx.label.createMany({
        data: [
          { workspaceId: newWorkspace.id, name: 'Frontend', color: '#3b82f6' },
          { workspaceId: newWorkspace.id, name: 'Backend', color: '#8b5cf6' },
          { workspaceId: newWorkspace.id, name: 'UI/UX', color: '#ec4899' },
          { workspaceId: newWorkspace.id, name: 'Bug', color: '#ef4444' },
        ],
      });

      return { user: newUser, workspace: newWorkspace };
    });

    const token = signToken({ userId: result.user.id, email: result.user.email });

    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatarUrl: result.user.avatarUrl,
        workspaces: [
          {
            id: result.workspace.id,
            name: result.workspace.name,
            slug: result.workspace.slug,
            role: 'OWNER',
          },
        ],
      },
    });

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
  }
}
