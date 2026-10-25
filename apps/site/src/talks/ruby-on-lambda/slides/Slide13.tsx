import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/13.svg?raw";

export function Slide13Slide() {
  return (
    <Slide title={"The tiny adapter meets real HTTP"} hideTitle layout="wide" className="ruby-slide ruby-slide-13">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"13 / The Rack boundary"}</p>
          <h2>{"The tiny adapter meets real HTTP"}</h2>
          <p className="ruby-subtitle">{"The edge cases are why maintained adapters exist."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Cookies, headers and binary data", "Request shape and response cleanup", "Lamby for the maintained integration"]} />
      </div>
      <SpeakerNote>
        <p>{"Let the simple adapter encounter the cases it skipped: repeated header values, cookies, binary payloads, path and query semantics, and closing a response body that requires cleanup. For Function URLs, outgoing cookies use the response cookies array instead of a hand-written set-cookie entry."}</p>
        <p>{"This is the payoff of rebuilding Lamby’s central idea: the audience understands the bridge well enough to reason about it. For a real supported deployment, a maintained integration can carry the compatibility burden. Do not claim that the teaching adapter implements the complete Rack specification or every API Gateway event shape."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Fan out the first hidden cases."}</li>
          <li>{"Add body and path responsibilities."}</li>
          <li>{"Return to Lamby with a concrete explanation of its value."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
