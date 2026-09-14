import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireWorkspaceMember } from '@/lib/permissions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return '';
  // Strip control characters and dangerous prompt injection tags
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/(system:|user:|assistant:|\[INST\]|\[\/INST\])/gi, '')
    .slice(0, 2000);
}

export async function POST(req) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ ip: `ai_${ip}`, limit: 20, windowMs: 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json({ error: 'AI Assistant rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }

    const body = await req.json();
    const { action, title, description, workspaceId } = body;

    if (workspaceId) {
      const member = await requireWorkspaceMember(workspaceId, user.id);
      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (action === 'BREAKDOWN') {
      const sanitizedTitle = sanitizeInput(title);
      const sanitizedDesc = sanitizeInput(description);

      if (!sanitizedTitle) {
        return NextResponse.json({ error: 'Title is required for task breakdown' }, { status: 400 });
      }

      if (apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        try {
          const prompt = `You are a project management assistant. Break down the following task into 3 to 5 clear, actionable subtasks. Return ONLY a valid JSON array of strings representing the subtask titles, with no markdown codeblocks or extra text.\nTask Title: "${sanitizedTitle}"\nDescription: "${sanitizedDesc || 'None'}"`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
              signal: controller.signal,
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
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const subtasks = generateSmartSubtasks(sanitizedTitle, sanitizedDesc);
      return NextResponse.json({ subtasks });
    }

    if (action === 'STANDUP') {
      const userTasks = await db.task.findMany({
        where: {
          assigneeId: user.id,
          ...(workspaceId ? { project: { workspaceId } } : {}),
        },
        include: {
          project: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      });

      const completed = userTasks.filter((t) => t.status === 'DONE');
      const inProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
      const todo = userTasks.filter((t) => t.status === 'TODO');

      if (apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const prompt = `You are a team lead writing a daily standup update for ${user.name}.
Given these user tasks:
Completed tasks: ${completed.map((t) => sanitizeInput(t.title)).join(', ') || 'None'}
In progress tasks: ${inProgress.map((t) => sanitizeInput(t.title)).join(', ') || 'None'}
To-do tasks: ${todo.map((t) => sanitizeInput(t.title)).join(', ') || 'None'}

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
              signal: controller.signal,
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
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const standup = generateSmartStandup(user.name, completed, inProgress, todo);
      return NextResponse.json({ standup });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    subtasks.push('Implement responsive styling & dark mode support');
    subtasks.push('Wire interactive state, handlers & loading spinners');
    subtasks.push('Conduct cross-browser & mobile viewport testing');
  } else if (t.includes('bug') || t.includes('fix') || t.includes('error') || t.includes('issue')) {
    subtasks.push('Reproduce bug environment & inspect error logs');
    subtasks.push('Identify root cause in component state or API query');
    subtasks.push('Apply fix & test boundary edge cases');
    subtasks.push('Verify regression behavior across related views');
  } else {
    subtasks.push(`Research requirements & technical specs for ${title}`);
    subtasks.push(`Build initial prototype & core implementation`);
    subtasks.push(`Perform code review, styling polish & testing`);
    subtasks.push(`Deploy changes & update workspace documentation`);
  }

  return subtasks;
}

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
