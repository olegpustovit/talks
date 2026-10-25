import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/12.svg?raw";

export function Slide12Slide() {
  return (
    <Slide title={"The bridge we can build"} hideTitle layout="wide" className="ruby-slide ruby-slide-12">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"12 / The Rack boundary"}</p>
          <h2>{"The bridge we can build"}</h2>
          <p className="ruby-subtitle">{"Translate the request. Call the app. Translate the response."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Map the event fields", "Build the Rack environment", "Encode the result for Lambda"]} />
      </div>
      <SpeakerNote>
        <p>{"Walk through a Function URL or API Gateway HTTP payload v2 event. Map the HTTP method, raw path and raw query into their Rack fields. Decode the body when marked as base64 and expose it as an IO-like rack.input. Construct the other fields required by the Rack specification as part of the actual adapter."}</p>
        <p>{"Call the application, then convert its status, headers and enumerable body into the integration response. The diagram is a mapping guide, not a complete implementation. HTTP integration event versions differ. Keeping this demonstration explicitly scoped to one event format makes it understandable and gives the next slide a reason to exist."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Read the AWS event column."}</li>
          <li>{"Connect each field to its Rack destination."}</li>
          <li>{"Reverse direction for the response."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
