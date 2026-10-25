import { useCallback, useEffect, useState } from "react";
import type { DeckState } from "./useRemoteControl";

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
  send: (type: "next" | "prev") => void;
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
      setSocket(ws);

      ws.addEventListener("open", () => {
        attempt = 0;
        setStatus((s) => ({ ...s, connected: true }));
        ws?.send(JSON.stringify({ type: "hello", role: "remote", password }));
      });

      ws.addEventListener("message", (event) => {
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
        setStatus((s) => ({ ...s, connected: false }));
        setSocket(null);
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
    };
  }, [password]);

  const send = useCallback(
    (type: "next" | "prev") => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type }));
    },
    [socket],
  );

  return { status, send, notesAllowed, deck };
}
