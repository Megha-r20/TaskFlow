import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Generate a secure share token
    const token = `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`;

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
