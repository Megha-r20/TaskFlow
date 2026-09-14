import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // Fetch active project data for client read-only display
    const project = await db.project.findFirst({
      include: {
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or link expired' }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        status: project.status,
        color: project.color,
        tasks: project.tasks || [],
      },
    });
  } catch (error) {
    console.error('Fetch public share project error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
