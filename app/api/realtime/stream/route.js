import { events, EVENT_TYPES } from '@/lib/events';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  // Auth check
  const user = await getSession();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  const encoder = new TextEncoder();
  let controllerRef = null;
  const listeners = [];

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      // Send initial "connected" heartbeat
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'CONNECTED', userId: user.id, ts: Date.now() })}\n\n`
          )
        );
      } catch (_) {}

      // Generic event handler — filters by workspaceId if provided
      const handleEvent = (data) => {
        // If a workspaceId filter is set, only forward matching workspace events
        if (workspaceId && data.workspaceId && data.workspaceId !== workspaceId) {
          return;
        }
        // For NOTIFICATION events, only forward to the target user
        if (data.type === EVENT_TYPES.NOTIFICATION && data.userId && data.userId !== user.id) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {
          // Controller may be closed
        }
      };

      // Subscribe to all event types
      const eventNames = Object.values(EVENT_TYPES);
      eventNames.forEach((eventName) => {
        events.on(eventName, handleEvent);
        listeners.push([eventName, handleEvent]);
      });

      // Heartbeat every 25s to keep the connection alive through proxies/firewalls
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (_) {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        listeners.forEach(([name, fn]) => events.off(name, fn));
        try {
          controller.close();
        } catch (_) {}
      });
    },
    cancel() {
      listeners.forEach(([name, fn]) => events.off(name, fn));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
