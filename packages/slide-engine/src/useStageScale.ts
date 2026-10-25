import { useEffect, useRef, useState } from "react";

export interface StageSize {
  width: number;
  height: number;
}

function computeScale(container: StageSize, canvas: StageSize): number {
  if (container.width <= 0 || container.height <= 0) return 1;
  return Math.min(container.width / canvas.width, container.height / canvas.height);
}

/**
 * Scales a fixed-size canvas to best-fit whatever real screen it lands on —
 * a browser window, a fullscreen projector, anything — preserving aspect
 * ratio (letterboxed, never cropped or distorted). `containerRef` goes on
 * the real-viewport element being fit into; the returned `scale` is applied
 * to a fixed-`canvas`-px stage nested inside it via CSS transform. Because
 * the stage's pixel size never changes, `container-type: size` on it turns
 * cqw/cqh units for its descendants into a fixed coordinate system too —
 * the whole point: identical layout on a laptop, a 4:3 conference room
 * projector, or a fullscreen 1080p output, never just "however this
 * screen's vw/vh happen to divide up".
 */
export function useStageScale(canvas: StageSize) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(() =>
    typeof window === "undefined" ? 1 : computeScale({ width: window.innerWidth, height: window.innerHeight }, canvas),
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(computeScale({ width: el.clientWidth, height: el.clientHeight }, canvas));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [canvas.width, canvas.height]);

  return { containerRef, scale };
}
