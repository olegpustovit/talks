import { useEffect, useState } from "react";
import { TerminalLog, useSlideIsActive } from "@talks/slide-engine";

/** The talk's visual mark: a trial process that dies and keeps its place. Title and Closing share it. */
export function TrialLog({ lines, className }: { lines: string[]; className?: string }) {
  const active = useSlideIsActive();
  const [n, setN] = useState(1);

  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      setN((count) => (count >= lines.length ? 1 : count + 1));
    }, 1100);
    return () => window.clearInterval(t);
  }, [active, lines.length]);

  return <TerminalLog title="trial.py" lines={lines} revealed={n} className={className} />;
}
