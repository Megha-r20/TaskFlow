import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      message: 'Login successful',
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

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
