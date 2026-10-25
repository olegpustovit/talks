import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/08.svg?raw";

export function Slide08Slide() {
  return (
    <Slide title={"How much can we remove?"} hideTitle layout="wide" className="ruby-slide ruby-slide-08">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"08 / Inside Lambda"}</p>
          <h2>{"How much can we remove?"}</h2>
          <p className="ruby-subtitle">{"Rails first. Then the adapter."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Remove framework boot", "Remove the integration abstraction", "Find the remaining contract"]} />
      </div>
      <SpeakerNote>
        <p>{"This is the playful turn in the talk. For the tiny workload, remove the framework and see what remains. Then remove Lamby temporarily so that its hidden translation becomes visible. Each removal should answer a question raised by the previous demonstration."}</p>
        <p>{"The exercise teaches fundamentals. It does not imply that a custom adapter is a better production choice than Lamby. Keep application behavior fixed where possible, so the audience understands what we removed and which behavior we must rebuild. The question becomes: what does Lambda actually pass us, and what interface would our Ruby application prefer?"}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Cross out Rails and name the avoided boot work."}</li>
          <li>{"Cross out Lamby and expose the integration."}</li>
          <li>{"Pause on the remaining question."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
