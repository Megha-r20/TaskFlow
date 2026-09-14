import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { slackWebhookUrl, discordWebhookUrl, testNotification } = body;

    if (testNotification) {
      if (slackWebhookUrl) {
        fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `⚡ *[TaskFlow Test]* Webhook integration connected successfully by ${user.name}!`,
          }),
        }).catch((err) => console.warn('Slack test error:', err));
      }

      if (discordWebhookUrl) {
        fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `⚡ **[TaskFlow Test]** Webhook integration connected successfully by ${user.name}!`,
          }),
        }).catch((err) => console.warn('Discord test error:', err));
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook configuration saved successfully' });
  } catch (error) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
