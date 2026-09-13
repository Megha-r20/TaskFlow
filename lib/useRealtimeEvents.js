'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * useRealtimeEvents — subscribes to the TaskFlow SSE stream and dispatches
 * typed real-time events to registered handler callbacks.
 *
 * @param {string|null} workspaceId - Filter events to this workspace
 * @param {object} handlers - Map of event type → callback, e.g. { TASK_UPDATED: fn }
 */
export function useRealtimeEvents(workspaceId, handlers = {}) {
  const eventSourceRef = useRef(null);
  const handlersRef = useRef(handlers);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting'|'connected'|'disconnected'|'error'

  // Keep handlers ref fresh without re-running the effect
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (!workspaceId) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/realtime/stream?workspaceId=${workspaceId}`;
    setConnectionStatus('connecting');

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnectionStatus('connected');
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const { type } = data;
        if (type && handlersRef.current[type]) {
          handlersRef.current[type](data);
        }
        // Also fire a wildcard handler if registered
        if (handlersRef.current['*']) {
          handlersRef.current['*'](data);
        }
      } catch (err) {
        console.error('[SSE] Parse error', err);
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setConnectionStatus('disconnected');

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttemptsRef.current + 1, 5);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      } else {
        setConnectionStatus('error');
      }
    };
  }, [workspaceId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { connectionStatus };
}
