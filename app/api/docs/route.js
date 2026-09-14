import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Default sample documents if not stored yet
    const initialDocs = [
      {
        id: 'doc-1',
        title: '🚀 Product Architecture & Specs',
        category: 'Engineering',
        content: '# Product Architecture\n\nTaskFlow is built on Next.js 15 App Router, WebRTC for live audio/video huddles, and Server-Sent Events (SSE) for instant task collaboration.\n\n## Core Subsystems\n- **Kanban Board**: Drag-and-drop state machine\n- **Real-Time Stream**: `/api/realtime/stream` SSE channel\n- **Huddle Engine**: WebRTC media tracks & floating dock',
        author: user.name,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'doc-2',
        title: '📋 Team Onboarding Guide',
        category: 'Onboarding',
        content: '# Welcome to TaskFlow\n\nWelcome team! Here is how to get started:\n1. Check your assigned items in **My Tasks**\n2. Use **Focus Mode** for distraction-free deep work\n3. Launch a **Team Huddle** when you need quick syncs',
        author: user.name,
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ docs: initialDocs });
  } catch (error) {
    console.error('Fetch docs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, category, content } = body;

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: title || 'Untitled Document',
      category: category || 'General',
      content: content || '# New Document\n\nStart typing here...',
      author: user.name,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ doc: newDoc });
  } catch (error) {
    console.error('Create doc error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
