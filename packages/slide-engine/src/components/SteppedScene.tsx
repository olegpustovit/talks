import { Fragment, useRef, type ReactNode } from "react";
import { useDeck, useFrames, useSlideIsActive } from "../Deck";
import { useSceneClock } from "../useSceneClock";
import "./LayeredDiagram.css";

export interface SteppedSceneProps {
  /** One cue per reveal; the arrow keys walk through them. */
  cues: string[];
  /**
   * Draw the scene for the clock `t` (seconds since the slide became active),
   * the current step, and `since` (seconds since that step began) for entrances.
   */
  children: (t: number, step: number, since: number) => ReactNode;
  /** Clock value used under reduced motion. Pick a moment that reads on its own. */
  still?: number;
  /**
   * From this step on the figure is marked `data-wide`, so the slide can hand
   * the scene the whole stage (fold the title away, say). The talk's CSS owns the move.
   */
  wideFrom?: number;
}

/**
 * A live, looping scene with the same caption and reveal buttons as
 * LayeredDiagram. The clock keeps running across steps, so motion never
 * restarts on a key press; scenes fade their own layers in by step.
 */
export function SteppedScene({ cues, children, still = 0, wideFrom }: SteppedSceneProps) {
  const { step, frame } = useFrames(cues);
  const t = useSceneClock(undefined, still);
  const active = useSlideIsActive();
  const deck = useDeck();
  const entered = useRef({ step, at: t });
  if (entered.current.step !== step || t < entered.current.at) entered.current = { step, at: t };
  // Under reduced motion the clock stands still, so show every entrance finished.
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const since = reduced ? 60 : t - entered.current.at;
  return (
    <figure className="se-layered-diagram" data-step={step} data-active={active} data-wide={wideFrom !== undefined && step >= wideFrom}>
      {/* Remount when the slide turns on or off: an inactive slide shows every step, and a scene that
          tweens between steps must not animate from "all revealed" back to step one on entry. */}
      <div className="se-layered-diagram-art"><Fragment key={String(active)}>{children(t, step, since)}</Fragment></div>
      <figcaption>
        <span aria-live={active ? "polite" : "off"}>{frame}</span>
        <div role="group" aria-label="Scene reveals">
          {cues.map((cue, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Reveal ${index + 1}: ${cue}`}
              aria-pressed={index === step}
              onClick={() => deck.goToStep(index)}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
