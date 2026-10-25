import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/04.svg?raw";

export function Slide04Slide() {
  return (
    <Slide title={"Lambda for intermittent work"} hideTitle layout="wide" className="ruby-slide ruby-slide-04">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"04 / The need"}</p>
          <h2>{"Lambda for intermittent work"}</h2>
          <p className="ruby-subtitle">{"The operating model is the reason to investigate."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Bursty traffic", "Compute follows invocations", "Cost includes the rest of the stack"]} />
      </div>
      <SpeakerNote>
        <p>{"For a small API with intermittent traffic, invocation-based compute can avoid running a dedicated process solely for occasional work. Existing capacity on a Puma server may already be cheaper and simpler; the claim is about a workload with a useful independent boundary."}</p>
        <p>{"Use low idle compute cost as the motivation. Free allowances depend on account eligibility, service and usage. Storage, requests, logs, data transfer, gateways and any provisioned capacity still contribute to the bill. The diagram is a schematic activity trace, not a price chart or a forecast."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Explain the pauses between requests."}</li>
          <li>{"Contrast continuous capacity with work-triggered compute."}</li>
          <li>{"Name the surrounding costs once."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html" target="_blank" rel="noopener noreferrer">{"Lambda concurrency"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
