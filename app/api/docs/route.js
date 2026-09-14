import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceMember } from '@/lib/permissions';
import { createDocSchema, validateBody } from '@/lib/validations';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const member = await requireWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let docs = await db.doc.findMany({
      where: { workspaceId },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Seed default documentation for workspace if empty
    if (docs.length === 0) {
      await db.doc.createMany({
        data: [
          {
            workspaceId,
            authorId: user.id,
            title: '🚀 Product Architecture & Specs',
            category: 'Engineering',
            content: '# Product Architecture\n\nTaskFlow is built on Next.js 15 App Router, WebRTC for live audio/video huddles, and Server-Sent Events (SSE) for instant task collaboration.\n\n## Core Subsystems\n- **Kanban Board**: Drag-and-drop state machine\n- **Real-Time Stream**: `/api/realtime/stream` SSE channel\n- **Huddle Engine**: WebRTC media tracks & floating dock',
          },
          {
            workspaceId,
            authorId: user.id,
            title: '📋 Team Onboarding Guide',
            category: 'Onboarding',
            content: '# Welcome to TaskFlow\n\nWelcome team! Here is how to get started:\n1. Check your assigned items in **My Tasks**\n2. Use **Focus Mode** for distraction-free deep work\n3. Launch a **Team Huddle** when you need quick syncs',
          },
        ],
      });

      docs = await db.doc.findMany({
        where: { workspaceId },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    const formattedDocs = docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      author: doc.author.name,
      authorId: doc.authorId,
      updatedAt: doc.updatedAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    }));

    return NextResponse.json({ docs: formattedDocs });
  } catch (error) {
    console.error('Fetch docs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { error, data } = validateBody(createDocSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const member = await requireWorkspaceMember(data.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = await db.doc.create({
      data: {
        workspaceId: data.workspaceId,
        authorId: user.id,
        title: data.title,
        category: data.category,
        content: data.content,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      doc: {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        content: doc.content,
        author: doc.author.name,
        authorId: doc.authorId,
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create doc error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, title, category, content } = body;

    if (!id) {
      return NextResponse.json({ error: 'Doc ID required' }, { status: 400 });
    }

    const doc = await db.doc.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(doc.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await db.doc.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
      },
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json({
      doc: {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        content: updated.content,
        author: updated.author.name,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update doc error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Doc ID required' }, { status: 400 });
    }

    const doc = await db.doc.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Doc not found' }, { status: 404 });
    }

    const member = await requireWorkspaceMember(doc.workspaceId, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.doc.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete doc error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
