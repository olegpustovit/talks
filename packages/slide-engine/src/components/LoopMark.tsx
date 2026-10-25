export interface LoopMarkProps {
  className?: string;
}

/**
 * A flat, thick-stroke interlocking-loop glyph — a signature graphic mark,
 * not an eyebrow label. A small nod to the self-referential "strange loop"
 * idea (Hofstadter/Escher): two rings that only make sense as a pair.
 * Decorative and cropped off the slide edge, sitting behind the slide
 * content (negative z-index) — never load-bearing.
 */
export function LoopMark({ className }: LoopMarkProps) {
  return (
    <svg
      className={[
        "pointer-events-none absolute -right-[6cqw] -bottom-[8cqh] z-[-1] h-auto w-[46cqw] max-w-[620px] text-accent opacity-[0.85]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 240 140"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="88" cy="70" r="54" fill="none" stroke="currentColor" strokeWidth="20" />
      <circle cx="152" cy="70" r="54" fill="none" stroke="currentColor" strokeWidth="20" />
    </svg>
  );
}
