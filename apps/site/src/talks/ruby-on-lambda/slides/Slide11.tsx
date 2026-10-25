import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/11.svg?raw";

export function Slide11Slide() {
  return (
    <Slide title={"Rack is a small contract"} hideTitle layout="wide" className="ruby-slide ruby-slide-11">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"11 / The Rack boundary"}</p>
          <h2>{"Rack is a small contract"}</h2>
          <p className="ruby-subtitle">{"A callable takes an environment and returns a response."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["The application callable", "The environment hash", "Status, headers and body"]} />
      </div>
      <SpeakerNote>
        <p>{"Now reveal Rack, after the audience has felt the need for it. The application responds to call with an environment hash. Its response contains the status, headers and body. This minimal example makes the contract concrete without requiring a framework tutorial."}</p>
        <p>{"Puma is one server that speaks this interface. A Lambda adapter can call the same app, which is why the application can retain its familiar routing, middleware and tests. Rack 3 headers use lower-case keys, and a response body is an enumerable with lifecycle obligations when relevant. The few visible lines demonstrate the core contract; the complete specification defines compatibility."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Read the small callable."}</li>
          <li>{"Follow env into the app."}</li>
          <li>{"Read the response tuple."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
