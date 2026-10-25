import type { CSSProperties } from "react";

const border: CSSProperties = {
  borderWidth: "var(--se-border-width)",
  borderRadius: "var(--se-radius)",
};

export function UglyFile({
  name,
  code,
  hot,
  added,
  className,
}: {
  name: string;
  code: string;
  hot?: boolean;
  /** Short "what this does" — shown in the title bar on new files. */
  added?: string;
  className?: string;
}) {
  const isNew = Boolean(hot || added);
  return (
    <div
      className={[
        "min-w-0 overflow-hidden border-border bg-surface font-mono",
        isNew ? "bg-accent/10" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...border,
        borderColor: isNew ? "var(--color-accent)" : "var(--color-border)",
      }}
    >
      <div
        className="flex flex-wrap items-baseline gap-x-2 border-border px-2 py-1 text-[0.7rem] font-bold tracking-tighter"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        <span className={isNew ? "text-fg" : "text-muted"}>{name}</span>
        {added && <span className="text-accent">{added}</span>}
      </div>
      <pre className="m-0 overflow-auto px-2 py-2 text-[0.68rem] leading-snug whitespace-pre">{code}</pre>
    </div>
  );
}
