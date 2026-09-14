import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSecureToken, hashToken } from '@/lib/security';
import { forgotPasswordSchema, validateBody } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Rate limit password reset requests (5 requests per 15 mins per IP)
    const ip = getClientIp(request);
    const limiter = rateLimit({ ip: `forgot_${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { error, data } = validateBody(forgotPasswordSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Do NOT expose whether account exists or not
    const genericResponse = {
      success: true,
      message: 'If an account exists for that email, a password reset link has been created.',
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // Invalidate existing active reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate secure token & token hash
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: rawToken,
        tokenHash,
        expiresAt,
      },
    });

    return NextResponse.json({
      ...genericResponse,
      resetToken: rawToken, // Provided in development for automated testing
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
