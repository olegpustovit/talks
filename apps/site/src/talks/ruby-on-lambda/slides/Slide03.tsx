import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/03.svg?raw";

export function Slide03Slide() {
  return (
    <Slide title={"HTTP behavior belongs together"} hideTitle layout="wide" className="ruby-slide ruby-slide-03">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"03 / The need"}</p>
          <h2>{"HTTP behavior belongs together"}</h2>
          <p className="ruby-subtitle">{"Routes, authentication and validation can remain in Ruby."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Cloud configuration spreads the behavior", "A Rack app keeps a familiar boundary", "Lambda supplies an execution target"]} />
      </div>
      <SpeakerNote>
        <p>{"A Ruby developer already knows how to express routes and middleware in an application and test that application locally. The appeal is preserving that workflow instead of representing every application concern as separate cloud configuration."}</p>
        <p>{"API Gateway remains useful for managed API features. The criticism is about distributing application behavior across configurations when one small app is easier to reason about. A proxy integration can route requests into the app. Authentication still needs a deliberate design and tests; neither Rack nor a public endpoint supplies it automatically."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Show the scattered responsibilities."}</li>
          <li>{"Replace the HTTP logic with one app boundary."}</li>
          <li>{"Keep the cloud integration thin."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
