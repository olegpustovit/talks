import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/24.svg?raw";

export function ClosingSlide() {
  return (
    <Slide title={"More room to build in Ruby"} hideTitle layout="wide" className="ruby-slide ruby-slide-24">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"24 / Beyond the runtime"}</p>
          <h2>{"More room to build in Ruby"}</h2>
          <p className="ruby-subtitle">{"A small API, a clear boundary, and code your team owns."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Keep the useful application", "Choose its execution environment", "Explore native compilation where it fits"]} />
      </div>
      <SpeakerNote>
        <p>{"Return to the opening problem: a useful API for a frontend, shortcut, agent or core service. We tried the familiar stack, exposed initialization, removed abstractions, rebuilt the Rack bridge, and then assembled an application around the actual Lambda constraints."}</p>
        <p>{"The audience should leave understanding both the mechanism and a place to use it. Lambda is one execution choice, Rack preserves a familiar application boundary, and SST is the chosen way to assemble infrastructure. The compiler experiment broadens the available tradeoffs while keeping code readable to the people responsible for it. Close with the audience’s next small API, not a universal migration claim."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Reconnect to the original application need."}</li>
          <li>{"Show Puma and Lambda as deliberate choices."}</li>
          <li>{"Leave the final question on screen."}</li>
        </ol>
      </SpeakerNote>
    </Slide>
  );
}
