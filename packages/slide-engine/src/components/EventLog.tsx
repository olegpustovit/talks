import { AnimatePresence, motion } from "motion/react";

export interface EventLogProps {
  filename?: string;
  lines: string[];
  /** How many lines are currently visible (1-based count, or use `lines.length`). */
  revealed?: number;
  className?: string;
}

/** Append-only history tape. New lines land from the bottom. */
export function EventLog({ filename = "history", lines, revealed, className }: EventLogProps) {
  const visible = lines.slice(0, revealed ?? lines.length);
  return (
    <div
      className={["overflow-hidden border-border bg-fg font-mono text-[0.85rem] text-bg", className]
        .filter(Boolean)
        .join(" ")}
      style={{ borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" }}
    >
      <div
        className="border-border px-3 py-1.5 text-[0.75rem] font-bold tracking-tighter text-bg/70"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        {filename}
      </div>
      <div className="flex min-h-[6.5rem] flex-col gap-1 px-3 py-2">
        {visible.length === 0 && <span className="text-bg/50">empty</span>}
        <AnimatePresence initial={false}>
          {visible.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={i === visible.length - 1 ? "text-accent" : ""}
            >
              <span className="mr-2 text-bg/45">{String(i + 1).padStart(2, "0")}</span>
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
