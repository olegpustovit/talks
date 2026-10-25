import { useState } from "react";
import { Button } from "./Button";
import { EventLog } from "./EventLog";
import { Tag } from "./Tag";

/**
 * Teaching replay runtime the speaker can actually click.
 * First call hits the provider. After kill + replace, the same call
 * returns the stored result and does not send again.
 */
export function ReplayDemo() {
  const [history, setHistory] = useState<{ name: string; result: string }[]>([]);
  const [alive, setAlive] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [sent, setSent] = useState(0);
  const [log, setLog] = useState<string[]>(["worker online"]);

  function callActivity() {
    if (!alive) {
      setLog((l) => [...l, "no worker — start a replacement"]);
      return;
    }
    if (replaying) {
      const hit = history[cursor];
      if (!hit) {
        setLog((l) => [...l, "past recorded history — new work would run here"]);
        setReplaying(false);
        return;
      }
      setLog((l) => [...l, `replay [${cursor}] ${hit.name} → ${hit.result} · no email`]);
      setCursor((c) => c + 1);
      return;
    }
    const rec = { name: "send_reminder", result: "accepted" };
    setHistory((h) => [...h, rec]);
    setSent((n) => n + 1);
    setLog((l) => [...l, "provider accepted · persisted history[0]"]);
  }

  function kill() {
    setAlive(false);
    setReplaying(false);
    setLog((l) => [...l, "worker killed"]);
  }

  function replaceWorker() {
    setAlive(true);
    setReplaying(true);
    setCursor(0);
    setLog((l) => [...l, "replacement worker · workflow starts at line 1"]);
  }

  return (
    <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(16ch,0.9fr)]">
      <EventLog filename="history.json" lines={log} />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag accent={alive}>{alive ? (replaying ? "replaying" : "worker live") : "worker dead"}</Tag>
          <Tag>emails sent {sent}</Tag>
        </div>
        <pre
          className="m-0 overflow-auto border-border bg-surface p-3 font-mono text-[0.8rem] leading-relaxed"
          style={{ borderWidth: "var(--se-border-width)" }}
        >
          {history.length === 0 ? "{}" : JSON.stringify(history, null, 2)}
        </pre>
        <div className="flex flex-wrap gap-2">
          <Button onClick={callActivity}>Call send_reminder</Button>
          <Button onClick={kill}>Kill worker</Button>
          <Button onClick={replaceWorker}>Start replacement</Button>
        </div>
      </div>
    </div>
  );
}
