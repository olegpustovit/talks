import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/05.svg?raw";

export function Slide05Slide() {
  return (
    <Slide title={"What Lambda actually runs"} hideTitle layout="wide" className="ruby-slide ruby-slide-05">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"05 / Inside Lambda"}</p>
          <h2>{"What Lambda actually runs"}</h2>
          <p className="ruby-subtitle">{"A managed environment invokes your handler."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["An execution environment", "Loaded runtime and Ruby code", "An event and a response"]} />
      </div>
      <SpeakerNote>
        <p>{"Give only enough Lambda background to support the experiment. Your code runs in a managed Linux execution environment. The runtime fetches an invocation and calls your configured handler with an event and context. For this talk we use the ordinary event-driven Lambda model."}</p>
        <p>{"An HTTP integration converts a web request into that event. The handler is not a public TCP server. Environment creation and application initialization affect the cold path; later invocations may reuse loaded code. Firecracker is implementation context, not a promise that this behaves like a server you administer."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Reveal the outer environment."}</li>
          <li>{"Place loaded Ruby inside it."}</li>
          <li>{"Trace the request and response boundary."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html" target="_blank" rel="noopener noreferrer">{"Custom runtime contract"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
