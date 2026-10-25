import type { ReactNode } from "react";
import { useSlideIsActive } from "../Deck";
import { useSceneClock } from "../useSceneClock";
import "./LayeredDiagram.css";

export interface LoopedSceneProps {
  /** One cue per beat; the scene walks through them on its own, then starts over. */
  cues: string[];
  /** Seconds per beat. */
  beat?: number;
  /** Same signature as SteppedScene, so a stepped scene can loop unchanged. */
  children: (t: number, step: number, since: number) => ReactNode;
  /** Clock value used under reduced motion. */
  still?: number;
}

/**
 * A stepped scene that plays itself: no arrow-key steps, the current cue in the caption and
 * a row of ticks showing where the loop is. For scenes the speaker talks over.
 */
export function LoopedScene({ cues, beat = 4, children, still = 0 }: LoopedSceneProps) {
  const t = useSceneClock(undefined, still);
  const active = useSlideIsActive();
  const step = Math.floor(t / beat) % cues.length;
  const since = t - Math.floor(t / beat) * beat;
  return (
    <figure className="se-layered-diagram se-looped-scene" data-step={step} data-active={active}>
      <div className="se-layered-diagram-art">{children(t, step, since)}</div>
      <figcaption>
        <span aria-live="off">{cues[step]}</span>
        <div aria-hidden="true" className="se-loop-ticks">
          {cues.map((_, i) => (
            <i key={i} data-on={i === step} style={i === step ? { animationDuration: `${beat}s` } : undefined} />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
