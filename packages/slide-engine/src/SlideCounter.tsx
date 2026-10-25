export function SlideCounter({ index, count }: { index: number; count: number }) {
  return (
    <div
      className="pointer-events-none fixed right-[clamp(1.75rem,5cqw,4.5rem)] bottom-4 z-10 flex items-baseline gap-[0.1em] font-bold tracking-tighter"
      aria-hidden="true"
    >
      <span className="text-[2.25rem] leading-none text-fg">{String(index + 1).padStart(2, "0")}</span>
      <span className="text-[1.1rem] text-muted">/{String(count).padStart(2, "0")}</span>
    </div>
  );
}
