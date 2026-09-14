import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { loginSchema, validateBody } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const limiter = rateLimit({ ip: `login_${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { error, data } = validateBody(loginSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
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

    const isMatch = await comparePassword(data.password, user.passwordHash);
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
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
