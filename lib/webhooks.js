// Helper to dispatch webhook notifications to Slack and Discord
export async function sendWebhookNotification(workspaceId, eventType, data) {
  if (!workspaceId) return;

  try {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      workspaceId,
      title: data.title || 'TaskFlow Notification',
      message: data.message || '',
    };

    // Attempt sending to custom stored webhook URLs if available
    const envSlack = process.env.SLACK_WEBHOOK_URL;
    const envDiscord = process.env.DISCORD_WEBHOOK_URL;

    if (envSlack) {
      await fetch(envSlack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `⚡ *[TaskFlow]* ${payload.title}\n${payload.message}` }),
      }).catch(() => {});
    }

    if (envDiscord) {
      await fetch(envDiscord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `⚡ **[TaskFlow]** ${payload.title}\n${payload.message}` }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err);
  }
}
