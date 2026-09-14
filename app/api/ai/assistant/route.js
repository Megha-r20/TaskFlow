import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, title, description, workspaceId } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (action === 'BREAKDOWN') {
      if (!title || title.trim() === '') {
        return NextResponse.json({ error: 'Title is required for task breakdown' }, { status: 400 });
      }

      // If Gemini API Key exists, try calling Gemini API
      if (apiKey) {
        try {
          const prompt = `You are a project management assistant. Break down the following task into 3 to 5 clear, actionable subtasks. Return ONLY a valid JSON array of strings representing the subtask titles, with no markdown codeblocks or extra text.\nTask Title: "${title}"\nDescription: "${description || 'None'}"`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const subtasks = JSON.parse(cleanedText);
            if (Array.isArray(subtasks) && subtasks.length > 0) {
              return NextResponse.json({ subtasks });
            }
          }
        } catch (apiErr) {
          console.warn('Gemini API call failed, falling back to smart breakdown engine:', apiErr);
        }
      }

      // Smart Contextual Breakdown Engine (Offline / Fallback)
      const subtasks = generateSmartSubtasks(title, description);
      return NextResponse.json({ subtasks });
    }

    if (action === 'STANDUP') {
      // Fetch user's active tasks in current workspace or across workspaces
      const targetWorkspaceId = workspaceId || user.workspaces?.[0]?.id;

      const userTasks = await prisma.task.findMany({
        where: {
          assigneeId: user.id,
          ...(targetWorkspaceId ? { project: { workspaceId: targetWorkspaceId } } : {}),
        },
        include: {
          project: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      });

      const completed = userTasks.filter((t) => t.status === 'DONE');
      const inProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW');
      const todo = userTasks.filter((t) => t.status === 'TODO');

      if (apiKey) {
        try {
          const prompt = `You are a team lead writing a daily standup update for ${user.name}.
Given these user tasks:
Completed tasks: ${completed.map((t) => t.title).join(', ') || 'None'}
In progress tasks: ${inProgress.map((t) => t.title).join(', ') || 'None'}
To-do tasks: ${todo.map((t) => t.title).join(', ') || 'None'}

Format a professional 3-bullet Daily Standup report with section headers:
🟢 What was accomplished
🟡 What is currently in progress
🔴 Blockers or Next Steps

Keep it concise and ready for Slack/Teams.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const standupText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (standupText) {
              return NextResponse.json({ standup: standupText });
            }
          }
        } catch (apiErr) {
          console.warn('Gemini API call failed for standup, falling back:', apiErr);
        }
      }

      // Smart Standup Generator (Offline / Fallback)
      const standup = generateSmartStandup(user.name, completed, inProgress, todo);
      return NextResponse.json({ standup });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── Smart Rule-Based Subtask Breakdown Engine ─────────────────────────────────
function generateSmartSubtasks(title, description = '') {
  const t = title.toLowerCase();
  const subtasks = [];

  if (t.includes('auth') || t.includes('login') || t.includes('signup') || t.includes('user')) {
    subtasks.push('Design user authentication form & UI layout');
    subtasks.push('Implement API endpoints for register/login with validation');
    subtasks.push('Secure JWT token session management & cookie storage');
    subtasks.push('Add error handling & toast notifications for auth failures');
  } else if (t.includes('api') || t.includes('backend') || t.includes('endpoint') || t.includes('database')) {
    subtasks.push('Define database schema models & migration script');
    subtasks.push('Build REST API endpoints & payload validation');
    subtasks.push('Connect middleware for authentication & role permissions');
    subtasks.push('Write integration tests & verify API response payloads');
  } else if (t.includes('ui') || t.includes('page') || t.includes('component') || t.includes('design')) {
    subtasks.push('Draft component structure & layout wireframe');
    subtasks.push('Implement responsive Tailwind CSS styling & dark mode support');
    subtasks.push('Wire interactive state, handlers & loading spinners');
    subtasks.push('Conduct cross-browser & mobile viewport testing');
  } else if (t.includes('bug') || t.includes('fix') || t.includes('error') || t.includes('issue')) {
    subtasks.push('Reproduce bug environment & inspect error logs');
    subtasks.push('Identify root cause in component state or API query');
    subtasks.push('Apply fix & test boundary edge cases');
    subtasks.push('Verify regression behavior across related views');
  } else {
    // General technical workflow subtasks
    subtasks.push(`Research requirements & technical specs for ${title}`);
    subtasks.push(`Build initial prototype & core implementation`);
    subtasks.push(`Perform code review, styling polish & testing`);
    subtasks.push(`Deploy changes & update workspace documentation`);
  }

  return subtasks;
}

// ── Smart Standup Generator Engine ───────────────────────────────────────────
function generateSmartStandup(userName, completed, inProgress, todo) {
  let text = `🚀 **Daily Standup Summary — ${userName}**\n\n`;

  text += `🟢 **What was accomplished:**\n`;
  if (completed.length > 0) {
    completed.forEach((t) => {
      text += `- Completed **${t.title}** (${t.project?.name || 'TaskFlow'})\n`;
    });
  } else {
    text += `- Focused on ongoing project planning and task reviews\n`;
  }

  text += `\n🟡 **What is currently in progress:**\n`;
  if (inProgress.length > 0) {
    inProgress.forEach((t) => {
      text += `- Working on **${t.title}** (${t.project?.name || 'TaskFlow'})\n`;
    });
  } else if (todo.length > 0) {
    text += `- Starting work on **${todo[0].title}**\n`;
  } else {
    text += `- Reviewing upcoming workspace roadmap items\n`;
  }

  text += `\n🔴 **Blockers or Next Steps:**\n`;
  text += `- No critical blockers. Proceeding with remaining task backlog.\n`;

  return text;
}
