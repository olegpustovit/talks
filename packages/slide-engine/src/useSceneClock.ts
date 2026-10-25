import { useEffect, useState } from "react";
import { useSlideIsActive } from "./Deck";

/**
 * Seconds since the slide became active (or since `resetKey` changed),
 * ticking every animation frame. Scenes take `t % period` to loop.
 * Under reduced motion it returns `still` — pick a frame that reads alone.
 */
export function useSceneClock(resetKey?: unknown, still = 0): number {
  const active = useSlideIsActive();
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) {
      setT(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(still);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      // rAF timestamps mark the frame start, which can precede `start` by a few ms.
      setT(Math.max(0, (now - start) / 1000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, resetKey, still]);

  return t;
}
