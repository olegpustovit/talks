import { useMemo } from "react";
import { useLoopFrames } from "../useLoopFrames";
import { advanceReplay, initialReplayState, type ReplayAction, type ReplayCommand } from "./executionReplayModel";

export interface ExecutionReplayProps {
  code: string;
  commands: ReplayCommand[];
  /** Played in order while the slide is on screen, then looped after `holdMs`. */
  script: ReplayAction[];
  filename?: string;
  stepMs?: number;
  holdMs?: number;
}

const LABEL = "m-0 text-xs font-bold tracking-tighter text-muted";

export function ExecutionReplay({
  code,
  commands,
  script,
  filename = "workflow.py",
  stepMs = 1800,
  holdMs = 4000,
}: ExecutionReplayProps) {
  const ticks = useMemo(() => Array.from({ length: script.length + 1 }, () => ({})), [script.length]);
  const { step: played } = useLoopFrames(ticks, { stepMs, holdMs });

  const state = useMemo(
    () => script.slice(0, played).reduce((s, action) => advanceReplay(s, action, commands), initialReplayState()),
    [script, played, commands],
  );
  const command = commands[state.cursor];
  const activityNames = [...new Set(commands.filter((c) => c.kind === "activity").map((c) => c.name))];

  return (
    <div className="overflow-hidden border-2 border-border bg-surface text-sm" data-testid="execution-replay">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <span className={`font-mono font-bold ${state.alive ? "" : "text-accent"}`} data-testid="worker-status">
          worker-{state.worker} · {state.alive ? "running" : "killed"} · day {state.day}
        </span>
      </div>
      <div className="grid lg:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-2 border-b border-border p-3 lg:border-r lg:border-b-0">
          <p className={LABEL}>{filename} · {command?.name ?? "complete"}</p>
          <pre className="m-0 overflow-x-auto bg-bg py-2 text-[clamp(0.75rem,1.6cqh,0.9rem)] leading-[1.45]" aria-label="Workflow code">
            {code.split("\n").map((line, i) => (
              <span key={i} className={`block border-l-4 pr-2 ${state.alive && command?.lines.includes(i + 1) ? "border-accent bg-accent/15" : "border-transparent"}`} aria-current={state.alive && command?.lines.includes(i + 1) ? "step" : undefined}>
                <span className="mr-3 inline-block w-6 text-right text-muted">{i + 1}</span>{line || " "}
              </span>
            ))}
          </pre>
          <div><p className={LABEL}>Worker memory</p><code data-testid="worker-memory">{state.memory}</code></div>
          <div className="flex flex-wrap gap-2" aria-label="External side effects">
            {activityNames.map((name) => <span key={name} className="border border-border px-2 py-1 font-mono text-xs">{name} ×{state.effects[name] ?? 0}</span>)}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2 p-3">
          <p className={LABEL}>Persistent history · outside the worker</p>
          <div className="flex flex-col gap-2" data-testid="persistent-history">
            {state.history.length === 0 ? <p className="m-0 text-muted">No saved events yet.</p> : state.history.map((event, i) => (
              <div key={i} className="border border-border bg-bg p-2 font-mono text-xs">
                <div className="font-bold">{i} · {event.name}</div>
                <div className="break-words">{JSON.stringify(event)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="m-0 border-t border-border px-3 py-2 text-sm" role="status">{state.status}</p>
    </div>
  );
}
