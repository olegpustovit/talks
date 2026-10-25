import { useDeck, useFrames, useSlideIsActive } from "../Deck";
import "./LayeredDiagram.css";

export interface LayeredDiagramProps {
  /** Trusted, locally authored SVG markup. Groups use layer-0, layer-1, etc. */
  svg: string;
  cues: string[];
}

/** Reveal an authored SVG using the deck's keyboard, pointer and remote steps. */
export function LayeredDiagram({ svg, cues }: LayeredDiagramProps) {
  const { step, frame } = useFrames(cues);
  const active = useSlideIsActive();
  const deck = useDeck();
  return (
    <figure className="se-layered-diagram" data-step={step} data-active={active}>
      <div className="se-layered-diagram-art" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        <span aria-live={active ? "polite" : "off"}>{frame}</span>
        <div role="group" aria-label="Diagram reveals">
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
