import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { hashToken } from '@/lib/security';
import { resetPasswordSchema, validateBody } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limiter = rateLimit({ ip: `reset_${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { error, data } = validateBody(resetPasswordSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const hashed = hashToken(data.token);

    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        OR: [{ tokenHash: hashed }, { token: data.token }],
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired password reset token' }, { status: 400 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'This reset token has already been used' }, { status: 400 });
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json({ error: 'This reset token has expired' }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(data.password);

    // Update user password and invalidate token in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
