import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSlideIsActive } from "../Deck";
import { Tag } from "./Tag";

export type FlowNodeSpec = {
  id: string;
  label: string;
  detail?: string;
};

export type FlowFrame = {
  active?: string[];
  done?: string[];
  dead?: string[];
  packet?: { from: number; to: number; label?: string; crashAt?: number };
  status?: string;
};

export interface FlowPlayProps {
  nodes: FlowNodeSpec[];
  frame: FlowFrame;
  className?: string;
}

function center(index: number, count: number): number {
  return ((index + 0.5) / count) * 100;
}

/** Animated process rail. Parent owns `useFrames` / `useSlideStep`. */
export function FlowPlay({ nodes, frame, className }: FlowPlayProps) {
  const reduce = useReducedMotion();
  const n = nodes.length;
  const packet = frame.packet;
  const dest = packet
    ? packet.crashAt != null
      ? center(packet.from, n) + (center(packet.to, n) - center(packet.from, n)) * packet.crashAt
      : center(packet.to, n)
    : 0;

  return (
    <div className={["flex w-full flex-col gap-3", className].filter(Boolean).join(" ")}>
      <div className="relative flex w-full items-stretch gap-2">
        <div className="pointer-events-none absolute top-[1.55rem] right-[8%] left-[8%] h-[3px] bg-fg" />
        {packet && (
          <motion.div
            key={`${packet.from}-${packet.to}-${packet.crashAt ?? "ok"}-${packet.label ?? ""}`}
            className="pointer-events-none absolute top-[1.2rem] z-10 h-3.5 w-3.5 -translate-x-1/2 bg-accent"
            initial={{ left: `${center(packet.from, n)}%`, opacity: 1 }}
            animate={{
              left: `${dest}%`,
              opacity: packet.crashAt != null ? [1, 1, 0] : 1,
            }}
            transition={{ duration: reduce ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        {nodes.map((node) => {
          const active = frame.active?.includes(node.id);
          const dead = frame.dead?.includes(node.id);
          const done = frame.done?.includes(node.id);
          return (
            <div
              key={node.id}
              className={[
                "relative z-[1] flex min-w-0 flex-1 flex-col gap-2 border-border p-[0.7em]",
                dead ? "border-dashed bg-bg opacity-55" : "border-solid bg-surface",
                active ? "bg-accent text-accent-fg" : "",
              ].join(" ")}
              style={{ borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" }}
            >
              <div className="flex flex-wrap gap-1">
                <Tag accent={!active}>{node.label}</Tag>
                {dead && <Tag accent>killed</Tag>}
              </div>
              {node.detail && (
                <p className={["m-0 text-[0.9rem] leading-snug", active ? "text-accent-fg" : "text-muted"].join(" ")}>
                  {node.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {packet?.label && (
        <p className="m-0 text-[0.9rem] font-bold tracking-tighter text-accent">{packet.label}</p>
      )}
      {frame.status && <p className="m-0 font-bold tracking-tighter text-muted">{frame.status}</p>}
    </div>
  );
}

export interface FlowLoopProps {
  nodes: FlowNodeSpec[];
  frames: FlowFrame[];
  intervalMs?: number;
}

/** Auto-playing flow for title/bookend slides. Does not steal arrow keys. */
export function FlowLoop({ nodes, frames, intervalMs = 1700 }: FlowLoopProps) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const active = useSlideIsActive();
  useEffect(() => {
    if (!active || reduce || frames.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % frames.length), intervalMs);
    return () => window.clearInterval(t);
  }, [active, reduce, frames.length, intervalMs]);
  const frame = frames[reduce ? frames.length - 1 : i] ?? {};
  return <FlowPlay nodes={nodes} frame={frame} />;
}
