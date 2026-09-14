import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireWorkspaceAdmin } from '@/lib/permissions';
import { isValidWebhookUrl } from '@/lib/webhooks';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const config = await db.webhookConfig.findUnique({
      where: { workspaceId },
    });

    return NextResponse.json({
      config: config || { slackUrl: '', discordUrl: '', events: 'ALL' },
    });
  } catch (error) {
    console.error('Fetch webhook config error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIp(request);
    const limiter = rateLimit({ ip: `webhooks_${ip}`, limit: 10, windowMs: 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json();
    const { workspaceId, slackWebhookUrl, discordWebhookUrl, testNotification } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const adminCheck = await requireWorkspaceAdmin(workspaceId, user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Only admins can manage webhook integrations' }, { status: 403 });
    }

    // SSRF & HTTPS Validation
    if (slackWebhookUrl && !isValidWebhookUrl(slackWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Slack Webhook URL. Must be an HTTPS external URL.' },
        { status: 400 }
      );
    }

    if (discordWebhookUrl && !isValidWebhookUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord Webhook URL. Must be an HTTPS external URL.' },
        { status: 400 }
      );
    }

    // Persist configuration in database
    const config = await db.webhookConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        slackUrl: slackWebhookUrl || null,
        discordUrl: discordWebhookUrl || null,
      },
      update: {
        slackUrl: slackWebhookUrl || null,
        discordUrl: discordWebhookUrl || null,
      },
    });

    // Handle optional test notification dispatch safely with 5s timeout
    if (testNotification) {
      const sendTest = async (url, formatPayload) => {
        if (!url || !isValidWebhookUrl(url)) return;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formatPayload()),
            signal: controller.signal,
          });
        } catch (err) {
          console.warn('Webhook test error:', err);
        } finally {
          clearTimeout(timeoutId);
        }
      };

      if (slackWebhookUrl) {
        await sendTest(slackWebhookUrl, () => ({
          text: `⚡ *[TaskFlow Test]* Webhook integration connected successfully by ${user.name}!`,
        }));
      }

      if (discordWebhookUrl) {
        await sendTest(discordWebhookUrl, () => ({
          content: `⚡ **[TaskFlow Test]** Webhook integration connected successfully by ${user.name}!`,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook configuration saved successfully',
      config,
    });
  } catch (error) {
    console.error('Save webhook config error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
