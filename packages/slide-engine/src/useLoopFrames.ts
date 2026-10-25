import { useEffect, useState } from "react";
import { useSlideIsActive } from "./Deck";

export interface LoopFrameOptions {
  stepMs?: number;
  holdMs?: number;
}

/** Autoplays frames while the slide is on screen, holds the last one, then loops. A frame's `ms` overrides `stepMs`. */
export function useLoopFrames<T extends object>(frames: T[], { stepMs = 1700, holdMs = 3800 }: LoopFrameOptions = {}) {
  const active = useSlideIsActive();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const last = step >= frames.length - 1;
    const custom = (frames[step] as { ms?: number } | undefined)?.ms;
    const timer = window.setTimeout(() => setStep(last ? 0 : step + 1), last ? holdMs : (custom ?? stepMs));
    return () => window.clearTimeout(timer);
  }, [active, step, frames, stepMs, holdMs]);

  return { step, frame: frames[Math.min(step, frames.length - 1)] as T };
}
