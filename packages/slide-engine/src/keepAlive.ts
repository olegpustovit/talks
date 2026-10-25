/**
 * Keeps a remote-control socket alive through proxies and phone sleep: a ping every 15 s, a
 * reconnect if nothing has come back for 35 s, and an immediate retry when the page becomes
 * visible again or the network returns. Returns a cleanup function.
 */
export function keepAlive(getSocket: () => WebSocket | null, reconnectNow: () => void): { seen: () => void; stop: () => void } {
  let lastSeen = Date.now();
  const timer = window.setInterval(() => {
    const ws = getSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - lastSeen > 35_000) {
      ws.close();
      return;
    }
    ws.send(JSON.stringify({ type: "ping" }));
  }, 15_000);
  const wake = () => {
    if (document.visibilityState === "hidden") return;
    const ws = getSocket();
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) reconnectNow();
    else if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
  };
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("online", wake);
  window.addEventListener("pageshow", wake);
  return {
    seen: () => {
      lastSeen = Date.now();
    },
    stop: () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("pageshow", wake);
    },
  };
}
