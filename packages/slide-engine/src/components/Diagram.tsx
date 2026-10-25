import type { CSSProperties, ReactNode } from "react";
import { Tag } from "./Tag";

const boxStyle: CSSProperties = {
  borderWidth: "var(--se-border-width)",
  borderRadius: "var(--se-radius)",
};

export interface DiagramProps {
  children: ReactNode;
  className?: string;
}

/** Vertical stack of diagram rows, nodes, and arrows. */
export function Diagram({ children, className }: DiagramProps) {
  return <div className={["flex w-full flex-col gap-3", className].filter(Boolean).join(" ")}>{children}</div>;
}

export interface DiagramRowProps {
  children: ReactNode;
  className?: string;
}

/** Horizontal cluster. Nodes share space; arrows stay centered. */
export function DiagramRow({ children, className }: DiagramRowProps) {
  return (
    <div className={["flex w-full flex-row flex-nowrap items-stretch gap-3", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export interface DiagramNodeProps {
  label?: ReactNode;
  accent?: boolean;
  muted?: boolean;
  children?: ReactNode;
  className?: string;
}

/** Bordered box. `accent` marks the important node; `muted` is the missing/failed one. */
export function DiagramNode({ label, accent, muted, children, className }: DiagramNodeProps) {
  return (
    <div
      className={[
        "flex min-w-0 flex-1 flex-col gap-2 bg-surface p-[0.8em]",
        muted ? "border-dashed opacity-60" : "border-solid",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...boxStyle, borderStyle: muted ? "dashed" : "solid", borderColor: "var(--color-border)" }}
    >
      {label != null && <Tag accent={accent}>{label}</Tag>}
      {children}
    </div>
  );
}

export interface ArrowProps {
  label?: ReactNode;
  direction?: "right" | "down";
  className?: string;
}

/** Thick-stroke arrow in the theme foreground. Optional caption sits above the shaft. */
export function Arrow({ label, direction = "right", className }: ArrowProps) {
  const vertical = direction === "down";
  return (
    <div
      className={[
        "flex shrink-0 flex-col items-center justify-center gap-1 self-center text-fg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label != null && (
        <span className="max-w-[16ch] text-center text-[0.9rem] font-bold leading-tight tracking-tighter text-muted">
          {label}
        </span>
      )}
      <svg
        viewBox={vertical ? "0 0 24 36" : "0 0 36 24"}
        className={vertical ? "h-9 w-6" : "h-6 w-9"}
        aria-hidden="true"
        focusable="false"
      >
        {vertical ? (
          <path d="M12 2 v24 M4 20 l8 12 8-12" fill="none" stroke="currentColor" strokeWidth="3" />
        ) : (
          <path d="M2 12 h24 M20 4 l12 8-12 8" fill="none" stroke="currentColor" strokeWidth="3" />
        )}
      </svg>
    </div>
  );
}

export interface TimelineItem {
  at: string;
  label: ReactNode;
  detail?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/** Horizontal milestone line. One item per column; the connecting bar is the argument. */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={["flex w-full items-start", className].filter(Boolean).join(" ")}>
      {items.map((item, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-3 pr-3 last:pr-0">
          <div className="flex items-center">
            <div className="h-3.5 w-3.5 shrink-0 bg-accent" />
            {i < items.length - 1 ? <div className="h-[3px] min-w-0 flex-1 bg-fg" /> : <div className="h-[3px] min-w-0 flex-1 bg-transparent" />}
          </div>
          <Tag accent>{item.at}</Tag>
          <p className="m-0 font-bold leading-tight tracking-tighter">{item.label}</p>
          {item.detail != null && <p className="m-0 text-[0.95rem] leading-snug text-muted">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export interface CaptionProps {
  children: ReactNode;
  className?: string;
}

/** Claim under a figure. Not a transcript — one sentence. */
export function Caption({ children, className }: CaptionProps) {
  return (
    <p className={["m-0 font-bold tracking-tighter text-muted", className].filter(Boolean).join(" ")}>{children}</p>
  );
}
