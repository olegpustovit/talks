import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/06.svg?raw";

export function Slide06Slide() {
  return (
    <Slide title={"Rails, unchanged behind Lamby"} hideTitle layout="wide" className="ruby-slide ruby-slide-06">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"06 / Inside Lambda"}</p>
          <h2>{"Rails, unchanged behind Lamby"}</h2>
          <p className="ruby-subtitle">{"The obvious experiment comes first."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["An HTTP request", "Lamby calls the Rails app", "Observe the first response"]} />
      </div>
      <SpeakerNote>
        <p>{"The audience’s obvious question is whether the existing Rails application can run here. Introduce Lamby only as the adapter that lets Lambda integration events reach a Rack application. Do not explain Rack internals yet. Rails already speaks that interface."}</p>
        <p>{"Run the Rails baseline or replay its captured demonstration, then observe startup. Lamby supports running Rails on Lambda, so this is not an argument that Rails cannot work. The interesting question is whether this particular framework and dependency set meets the startup and operational goals of our small API."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Send the same small request."}</li>
          <li>{"Name Lamby’s job in one sentence."}</li>
          <li>{"Let the startup observation create the next question."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
