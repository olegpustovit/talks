import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/15.svg?raw";

export function Slide15Slide() {
  return (
    <Slide title={"The constraints change the design"} hideTitle layout="wide" className="ruby-slide ruby-slide-15">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"15 / Designing the application"}</p>
          <h2>{"The constraints change the design"}</h2>
          <p className="ruby-subtitle">{"Small requests and durable handoffs fit the model."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Large uploads bypass the API", "Post-response work needs a durable path", "Retries and state need explicit handling"]} />
      </div>
      <SpeakerNote>
        <p>{"The ordinary synchronous Lambda invocation payload limit is 6 MB, including the event envelope. Base64 and integration overhead reduce the usable raw body size. An endpoint is not a good transit point for arbitrary file uploads. Let the client upload directly to S3 after authorization."}</p>
        <p>{"The invocation has a timeout, and returning does not make background threads a durable job system. Use a queue or another durable workflow for important later work. Concurrent invocations and event retries mean database connections, idempotency and shared state need attention. Keep durable business state out of process memory. An initialization linter is a possible future experiment, rather than an implemented feature."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Let a large upload hit the request boundary."}</li>
          <li>{"Move later work past a durable handoff."}</li>
          <li>{"Name the remaining constraints as design inputs."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html" target="_blank" rel="noopener noreferrer">{"Lambda quotas"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
