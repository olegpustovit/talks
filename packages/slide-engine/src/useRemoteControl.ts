import { isStaticDeployment } from "./deployment";
import { useEffect, useRef } from "react";
import { keepAlive } from "./keepAlive";
import type { NotePlan } from "./noteText";

export type RemoteCommand = "next" | "prev" | "nextSlide" | "prevSlide";

/** A trackpad pointer on the stage, in 0..1 of its width and height. */
export type RemotePointer = { x: number; y: number; click?: boolean; hide?: boolean };
/** Two-finger scroll at a stage point (0..1), by dx/dy stage pixels. */
export type RemoteScroll = { x: number; y: number; dx: number; dy: number };

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
  /** Every slide's title, so a remote can jump straight to one. */
  titles: string[];
  /** The current slide's step captions, step 0 first; empty when its steps have none. */
  stepLabels: string[];
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
    nextSlide?: () => void;
    prevSlide?: () => void;
    goTo?: (index: number) => void;
    pointer?: (p: RemotePointer) => void;
    scroll?: (s: RemoteScroll) => void;
  },
  state?: DeckState,
  enabled = true,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const stateJSON = state ? JSON.stringify({ type: "state", state }) : null;
  const stateRef = useRef(stateJSON);
  stateRef.current = stateJSON;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isStaticDeployment || !enabled) return;
    let closed = false;
    let ws: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempt = 0;

    function connect() {
      if (closed) return;
      ws = new WebSocket(wsURL());
      const sock = ws;
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        attempt = 0;
        ws?.send(JSON.stringify({ type: "hello", role: "deck" }));
        if (stateRef.current) ws?.send(stateRef.current);
      });

      ws.addEventListener("message", (event) => {
        alive.seen();
        let msg: { type?: string; index?: number; dx?: number; dy?: number } & Partial<RemotePointer>;
        try {
          msg = JSON.parse(String(event.data)) as typeof msg;
        } catch {
          return;
        }
        const h = handlersRef.current;
        if (msg.type === "next") h.next();
        if (msg.type === "prev") h.prev();
        if (msg.type === "nextSlide") h.nextSlide?.();
        if (msg.type === "prevSlide") h.prevSlide?.();
        if (msg.type === "goto" && typeof msg.index === "number") h.goTo?.(msg.index);
        if (msg.type === "pointer" && typeof msg.x === "number" && typeof msg.y === "number")
          h.pointer?.({ x: msg.x, y: msg.y, click: msg.click, hide: msg.hide });
        if (msg.type === "scroll" && typeof msg.x === "number" && typeof msg.y === "number")
          h.scroll?.({ x: msg.x, y: msg.y, dx: msg.dx ?? 0, dy: msg.dy ?? 0 });
      });

      ws.addEventListener("close", () => {
        // A socket replaced by a forced reconnect must not schedule another one.
        if (closed || sock !== ws) return;
        const delay = Math.min(500 * 2 ** attempt, 4000);
        attempt += 1;
        retryTimer = window.setTimeout(connect, delay);
      });

      ws.addEventListener("error", () => {
        ws?.close();
      });
    }

    const alive = keepAlive(
      () => ws,
      () => {
        if (closed) return;
        if (retryTimer !== undefined) window.clearTimeout(retryTimer);
        attempt = 0;
        ws?.close();
        connect();
      },
    );
    connect();

    return () => {
      alive.stop();
      closed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      ws?.close();
      wsRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const ws = wsRef.current;
    if (stateJSON && ws?.readyState === WebSocket.OPEN) ws.send(stateJSON);
  }, [stateJSON]);
}
