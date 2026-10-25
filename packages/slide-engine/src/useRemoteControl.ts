import { isStaticDeployment } from "./deployment";
import { useEffect, useRef } from "react";
import type { NotePlan } from "./noteText";

export type RemoteCommand = "next" | "prev";

/** What a presenting deck tells phone remotes: where it is and how long it planned to stay. */
export type DeckState = {
  talk: string;
  index: number;
  count: number;
  title: string;
  /** Title of the following slide; empty on the last one. */
  next: string;
  step: number;
  steps: number;
  /** Epoch ms when the deck arrived on this slide. */
  slideStartedAt: number;
  /** Planned window from the slide's speaker-note cue line; the notes themselves are not sent. */
  plan: NotePlan | null;
};

function wsURL(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * Connects a presenting deck to the Go /ws hub: runs next/prev when a phone
 * remote sends them, and publishes `state` whenever it changes. No-op when
 * WebSocket is unavailable.
 */
export function useRemoteControl(
  handlers: {
    next: () => void;
    prev: () => void;
  },
  state?: DeckState,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const stateJSON = state ? JSON.stringify({ type: "state", state }) : null;
  const stateRef = useRef(stateJSON);
  stateRef.current = stateJSON;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isStaticDeployment) return;
    let closed = false;
    let ws: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempt = 0;

    function connect() {
      if (closed) return;
      ws = new WebSocket(wsURL());
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        attempt = 0;
        ws?.send(JSON.stringify({ type: "hello", role: "deck" }));
        if (stateRef.current) ws?.send(stateRef.current);
      });

      ws.addEventListener("message", (event) => {
        let msg: { type?: string };
        try {
          msg = JSON.parse(String(event.data)) as { type?: string };
        } catch {
          return;
        }
        if (msg.type === "next") handlersRef.current.next();
        if (msg.type === "prev") handlersRef.current.prev();
      });

      ws.addEventListener("close", () => {
        if (closed) return;
        const delay = Math.min(1000 * 2 ** attempt, 8000);
        attempt += 1;
        retryTimer = window.setTimeout(connect, delay);
      });

      ws.addEventListener("error", () => {
        ws?.close();
      });
    }

    connect();

    return () => {
      closed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      ws?.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (stateJSON && ws?.readyState === WebSocket.OPEN) ws.send(stateJSON);
  }, [stateJSON]);
}
