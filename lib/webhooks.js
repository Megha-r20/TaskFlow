import { db } from './db.js';

// SSRF Protection: Validate webhook target URLs
export function isValidWebhookUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const parsed = new URL(urlString);

    // 1. Only HTTPS allowed
    if (parsed.protocol !== 'https:') return false;

    // 2. Reject localhost & internal network targets
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Helper to dispatch webhook notifications safely with 5s timeout & SSRF protection
export async function sendWebhookNotification(workspaceId, eventType, data) {
  if (!workspaceId) return;

  try {
    // Check database for workspace webhook config first
    const config = await db.webhookConfig.findUnique({
      where: { workspaceId },
    }).catch(() => null);

    const slackUrl = config?.slackUrl || process.env.SLACK_WEBHOOK_URL;
    const discordUrl = config?.discordUrl || process.env.DISCORD_WEBHOOK_URL;

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      workspaceId,
      title: data.title || 'TaskFlow Notification',
      message: data.message || '',
    };

    const dispatch = async (url, formatBody) => {
      if (!url || !isValidWebhookUrl(url)) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatBody(payload)),
          signal: controller.signal,
        });
      } catch (err) {
        // Silently capture timeout or network error without crashing main flow
      } finally {
        clearTimeout(timeoutId);
      }
    };

    if (slackUrl) {
      await dispatch(slackUrl, (p) => ({
        text: `⚡ *[TaskFlow]* ${p.title}\n${p.message}`,
      }));
    }

    if (discordUrl) {
      await dispatch(discordUrl, (p) => ({
        content: `⚡ **[TaskFlow]** ${p.title}\n${p.message}`,
      }));
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err);
  }
}
