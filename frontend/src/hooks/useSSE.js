import { useEffect, useRef } from 'react';
import { getEventsUrl } from '../services/api';

/**
 * Connects to the SSE endpoint and calls onEvent for each incoming message.
 * Auto-reconnects on disconnect (built into EventSource).
 */
export function useSSE(onEvent) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const es = new EventSource(getEventsUrl());

    es.onmessage = (event) => {
      callbackRef.current(JSON.parse(event.data));
    };

    es.onerror = () => {
      console.error('SSE connection lost, will auto-reconnect...');
    };

    return () => es.close();
  }, []);
}
