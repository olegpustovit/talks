import type { ReactNode } from "react";

export type StepState = "idle" | "active" | "done" | "failed" | "undone";

const border = { borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" } as const;

export interface ScenePanelProps {
  title: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A product-style window for looping demos: title bar, body, and a narration line. */
export function ScenePanel({ title, meta, status, children, className }: ScenePanelProps) {
  return (
    <div className={["flex min-w-0 flex-col overflow-hidden border-border bg-surface", className].filter(Boolean).join(" ")} style={border}>
      <div className="flex items-center justify-between gap-3 border-border px-3 py-2" style={{ borderBottomWidth: "var(--se-border-width)" }}>
        <p className="m-0 truncate text-[0.95rem] font-bold tracking-tighter">{title}</p>
        {meta != null && <p className="m-0 shrink-0 font-mono text-[0.75rem] text-muted">{meta}</p>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">{children}</div>
      {status != null && (
        <p
          role="status"
          className="m-0 min-h-[3.4em] border-border px-3 py-2 text-[0.95rem] leading-snug font-bold tracking-tighter"
          style={{ borderTopWidth: "var(--se-border-width)" }}
        >
          {status}
        </p>
      )}
    </div>
  );
}

const ICON: Record<StepState, string> = { idle: "", active: "…", done: "✓", failed: "✗", undone: "↩" };

export interface StepRowProps {
  label: ReactNode;
  detail?: ReactNode;
  state: StepState;
}

export function StepRow({ label, detail, state }: StepRowProps) {
  const failed = state === "failed";
  return (
    <div
      className={[
        "flex items-center gap-3 px-2 py-1.5 transition-colors duration-300",
        failed ? "bg-fg text-bg" : state === "active" ? "bg-accent/15" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center text-[0.8rem] font-bold transition-colors duration-300",
          state === "idle" ? "border-2 border-dashed border-muted/50" : "",
          state === "active" ? "animate-pulse bg-accent text-accent-fg" : "",
          state === "done" ? "bg-fg text-bg" : "",
          failed ? "bg-bg text-fg" : "",
          state === "undone" ? "bg-accent text-accent-fg" : "",
        ].join(" ")}
      >
        {ICON[state]}
      </span>
      <span className={["min-w-0 flex-1 truncate font-mono text-[0.85rem]", state === "idle" ? "text-muted" : ""].join(" ")}>{label}</span>
      {detail != null && (
        <span className={["shrink-0 text-[0.8rem] font-bold tracking-tighter", failed ? "text-bg" : "text-muted"].join(" ")}>{detail}</span>
      )}
    </div>
  );
}

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  accent?: boolean;
}

export function Stat({ label, value, accent }: StatProps) {
  return (
    <div className={["flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2 transition-colors duration-300", accent ? "bg-accent text-accent-fg" : "bg-bg"].join(" ")}>
      <span className="truncate text-[0.75rem] font-bold tracking-tighter opacity-70">{label}</span>
      <span className="truncate font-mono text-[clamp(1.05rem,1.9cqw,1.45rem)] font-bold tabular-nums">{value}</span>
    </div>
  );
}
