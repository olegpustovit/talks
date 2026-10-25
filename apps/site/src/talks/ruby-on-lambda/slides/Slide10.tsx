import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/10.svg?raw";

export function Slide10Slide() {
  return (
    <Slide title={"Two protocols at the boundary"} hideTitle layout="wide" className="ruby-slide ruby-slide-10">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"10 / The Rack boundary"}</p>
          <h2>{"Two protocols at the boundary"}</h2>
          <p className="ruby-subtitle">{"HTTP translation and runtime polling do different jobs."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["HTTP becomes an event", "The handler receives that event", "The runtime manages invocation delivery"]} />
      </div>
      <SpeakerNote>
        <p>{"Separate two boundaries that are easy to conflate. Function URLs or API Gateway convert an incoming HTTP request into an event and map the result back to HTTP. A Rack adapter translates between that event format and the Ruby application interface."}</p>
        <p>{"The Runtime API is a different interface. The managed runtime obtains the next invocation, calls the handler and posts its result or error. A custom runtime implements this loop. We will return to that when running a compiled binary, but removing Lamby alone does not require replacing the managed Ruby runtime."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Trace the external HTTP integration."}</li>
          <li>{"Show the handler’s event boundary."}</li>
          <li>{"Distinguish the runtime loop underneath it."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html" target="_blank" rel="noopener noreferrer">{"Custom runtime contract"}</a></p>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
