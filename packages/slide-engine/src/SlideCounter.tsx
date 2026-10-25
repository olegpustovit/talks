// A theme can restyle the counter with tokens (theme.tokens → --se-*):
// counter-current and counter-total are `font` shorthands without the family,
// counter-right and counter-bottom place it on the stage.
export function SlideCounter({ index, count }: { index: number; count: number }) {
  return (
    <div
      className="pointer-events-none fixed z-10 flex items-baseline gap-[0.1em] tabular-nums"
      style={{
        right: "var(--se-counter-right, clamp(1.75rem, 5cqw, 4.5rem))",
        bottom: "var(--se-counter-bottom, 1rem)",
        letterSpacing: "var(--se-counter-tracking, -0.05em)",
      }}
      aria-hidden="true"
    >
      <span className="text-fg" style={{ font: "var(--se-counter-current, 700 2.25rem/1) var(--font-sans)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-muted" style={{ font: "var(--se-counter-total, 700 1.1rem/1) var(--font-sans)" }}>
        /{String(count).padStart(2, "0")}
      </span>
    </div>
  );
}
