import type { ReactNode } from "react";

export interface TagProps {
  accent?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The one and only label style in the engine: a solid-color chip, bold,
 * sentence case, tight tracking. Never uppercase text spread out with
 * letter-spacing — that pattern is banned, see AGENTS.md.
 */
export function Tag({ accent, className, children }: TagProps) {
  return (
    <span
      className={[
        "inline-block w-fit px-[0.65em] py-[0.3em] text-[0.85rem] font-bold leading-tight tracking-tighter",
        accent ? "bg-accent text-accent-fg" : "bg-fg text-bg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
