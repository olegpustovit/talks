import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

const border = {
  borderWidth: "var(--se-border-width)",
  borderRadius: "var(--se-radius)",
} as const;

export function Phone({ children, time = "09:41" }: { children: ReactNode; time?: string }) {
  return (
    <div className="flex w-[230px] shrink-0 flex-col overflow-hidden bg-fg text-bg" style={{ ...border, borderRadius: "1.7rem" }}>
      <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[0.7rem] font-bold tracking-tighter">
        <span>{time}</span>
        <span className="h-3.5 w-20 rounded-full bg-bg/25" />
        <span>5G</span>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-4">{children}</div>
    </div>
  );
}

export function Banner({
  title,
  body,
  accent,
  show = true,
}: {
  title: string;
  body: string;
  accent?: boolean;
  show?: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={accent ? "bg-accent text-accent-fg" : "bg-bg text-fg"}
          style={{ borderRadius: "0.75rem" }}
        >
          <p className="m-0 px-3 pt-2 text-[0.65rem] font-bold tracking-tighter opacity-70">Mail</p>
          <p className="m-0 px-3 text-[0.95rem] font-bold tracking-tighter">{title}</p>
          <p className="m-0 px-3 pb-2 text-[0.8rem] leading-snug opacity-85">{body}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Terminal({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={["flex flex-col overflow-hidden border-border bg-fg font-mono text-[0.85rem] leading-relaxed text-bg", className]
        .filter(Boolean)
        .join(" ")}
      style={border}
    >
      <div
        className="shrink-0 border-border px-3 py-1.5 text-[0.75rem] font-bold tracking-tighter text-bg/70"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-3 py-3">{children}</div>
    </div>
  );
}

/** One log line that fades/slides in. Wrap Terminal children in AnimatePresence. */
export function LogLine({ children }: { children: ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function TerminalLog({
  title,
  lines,
  revealed,
  className,
}: {
  title: string;
  lines: string[];
  revealed: number;
  className?: string;
}) {
  const visible = lines.slice(0, Math.max(0, revealed));
  return (
    <Terminal title={title} className={className}>
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((line) => (
          <LogLine key={line}>{line}</LogLine>
        ))}
      </AnimatePresence>
    </Terminal>
  );
}

export function Inbox({ title = "Inbox", children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={["flex min-w-0 flex-1 flex-col overflow-hidden border-border bg-surface", className].filter(Boolean).join(" ")} style={border}>
      <div
        className="border-border px-3 py-1.5 text-[0.8rem] font-bold tracking-tighter"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function AppWindow({
  product,
  children,
  className,
}: {
  product: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["flex min-h-[14rem] flex-col overflow-hidden border-border bg-surface", className]
        .filter(Boolean)
        .join(" ")}
      style={border}
    >
      <div
        className="flex items-center justify-between border-border px-4 py-2"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        <p className="m-0 font-bold tracking-tighter">{product}</p>
        <p className="m-0 text-[0.8rem] text-muted">app</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-5">{children}</div>
    </div>
  );
}

export function Email({
  from,
  subject,
  children,
  className,
}: {
  from: string;
  subject: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["flex min-h-[14rem] flex-col overflow-hidden border-border bg-surface", className]
        .filter(Boolean)
        .join(" ")}
      style={border}
    >
      <div className="border-border px-5 py-3" style={{ borderBottomWidth: "var(--se-border-width)" }}>
        <p className="m-0 text-[0.85rem] text-muted">{from}</p>
        <p className="m-0 text-[clamp(1.2rem,2.2cqw,1.6rem)] font-bold leading-tight tracking-tighter">{subject}</p>
      </div>
      <div className="px-5 py-4 leading-snug">{children}</div>
    </div>
  );
}

export function MailRow({
  from,
  subject,
  preview,
  time,
  duplicate,
}: {
  from: string;
  subject: string;
  preview: string;
  time: string;
  duplicate?: boolean;
}) {
  return (
    <div
      className={["flex items-start gap-3 px-3 py-2.5", duplicate ? "bg-accent text-accent-fg" : "bg-surface"].join(" ")}
      style={{ borderBottomWidth: "var(--se-border-width)", borderColor: "var(--color-border)" }}
    >
      <div className={["mt-0.5 h-8 w-8 shrink-0 font-bold", duplicate ? "bg-accent-fg text-accent" : "bg-fg text-bg"].join(" ")}>
        <span className="flex h-full items-center justify-center text-[0.75rem]">{from.slice(0, 1)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="m-0 truncate text-[0.95rem] font-bold tracking-tighter">{from}</p>
          <p className="m-0 shrink-0 text-[0.75rem] opacity-70">{time}</p>
        </div>
        <p className="m-0 truncate font-bold tracking-tighter">{subject}</p>
        <p className="m-0 truncate text-[0.85rem] opacity-80">{preview}</p>
      </div>
    </div>
  );
}
