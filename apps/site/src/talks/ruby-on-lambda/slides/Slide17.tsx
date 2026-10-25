import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/17.svg?raw";

export function Slide17Slide() {
  return (
    <Slide title={"Files and jobs without a big API"} hideTitle layout="wide" className="ruby-slide ruby-slide-17">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"17 / Designing the application"}</p>
          <h2>{"Files and jobs without a big API"}</h2>
          <p className="ruby-subtitle">{"Authorization stays synchronous. Heavy work moves out."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Authorize the request", "Send bytes directly to storage", "Queue the processing"]} />
      </div>
      <SpeakerNote>
        <p>{"Tie the constraints back to a useful application. The Ruby API authenticates and authorizes an upload, then returns a signed S3 URL. The client sends the bytes directly to S3. An event can enter SQS and trigger a worker for processing. Restrict the signed operation, object key and lifetime appropriately."}</p>
        <p>{"Rack belongs on the HTTP API. The queue consumer is a Ruby event handler and does not need to pretend to be an HTTP request. The worker needs idempotent processing and explicit retry and failure handling. The same pattern can front job submissions or agent actions while a long-running core service remains on its existing compute."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Trace the authorization round trip."}</li>
          <li>{"Follow the bypass path carrying the file."}</li>
          <li>{"Reveal durable processing."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html" target="_blank" rel="noopener noreferrer">{"Lambda quotas"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
