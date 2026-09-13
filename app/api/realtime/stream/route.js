import { events } from '@/lib/events';

export async function GET(req) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onEvent = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      events.on('TASK_CREATED', onEvent);
      events.on('TASK_UPDATED', onEvent);
      events.on('TASK_DELETED', onEvent);

      req.signal.addEventListener('abort', () => {
        events.off('TASK_CREATED', onEvent);
        events.off('TASK_UPDATED', onEvent);
        events.off('TASK_DELETED', onEvent);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
