import { keepAlive } from "./keepAlive";
import { useCallback, useEffect, useState } from "react";
import type { DeckState, RemotePointer, RemoteScroll } from "./useRemoteControl";

type Status = {
  connected: boolean;
  decks: number;
  remotes: number;
};

function wsURL(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * Phone remote: connect as role=remote and send next/prev to decks. With the
 * right `password` (or none configured on the server), it also receives the
 * presenting deck's current slide, next slide and planned timing.
 */
export function useRemoteSender(password = ""): {
  status: Status;
  send: (type: "next" | "prev" | "nextSlide" | "prevSlide") => void;
  goTo: (index: number) => void;
  point: (p: RemotePointer) => void;
  scroll: (s: RemoteScroll) => void;
  /** null until the hub has answered this connection's hello. */
  notesAllowed: boolean | null;
  deck: DeckState | null;
} {
  const [status, setStatus] = useState<Status>({
    connected: false,
    decks: 0,
    remotes: 0,
  });
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [notesAllowed, setNotesAllowed] = useState<boolean | null>(null);
  const [deck, setDeck] = useState<DeckState | null>(null);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempt = 0;

    function connect() {
      if (closed) return;
      ws = new WebSocket(wsURL());
      const sock = ws;
      setSocket(ws);

      ws.addEventListener("open", () => {
        attempt = 0;
        setStatus((s) => ({ ...s, connected: true }));
        ws?.send(JSON.stringify({ type: "hello", role: "remote", password }));
      });

      ws.addEventListener("message", (event) => {
        alive.seen();
        let msg: {
          type?: string;
          role?: string;
          decks?: number;
          remotes?: number;
          notes?: boolean;
          state?: DeckState;
        };
        try {
          msg = JSON.parse(String(event.data)) as typeof msg;
        } catch {
          return;
        }
        if (msg.type === "status") {
          setStatus({
            connected: true,
            decks: msg.decks ?? 0,
            remotes: msg.remotes ?? 0,
          });
        }
        // The hub greets every connection as a deck before our hello lands.
        if (msg.type === "hello" && msg.role === "remote") {
          setNotesAllowed(Boolean(msg.notes));
          if (!msg.notes) setDeck(null);
        }
        if (msg.type === "state" && msg.state) setDeck(msg.state);
      });

      ws.addEventListener("close", () => {
        // A socket replaced by a forced reconnect must not touch state or schedule another one.
        if (closed || sock !== ws) return;
        setStatus((s) => ({ ...s, connected: false }));
        setSocket(null);
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
    };
  }, [password]);

  const raw = useCallback(
    (msg: object) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(msg));
    },
    [socket],
  );
  const send = useCallback((type: "next" | "prev" | "nextSlide" | "prevSlide") => raw({ type }), [raw]);
  const goTo = useCallback((index: number) => raw({ type: "goto", index }), [raw]);
  const point = useCallback((p: RemotePointer) => raw({ type: "pointer", ...p }), [raw]);
  const scroll = useCallback((s: RemoteScroll) => raw({ type: "scroll", ...s }), [raw]);

  return { status, send, goTo, point, scroll, notesAllowed, deck };
}
