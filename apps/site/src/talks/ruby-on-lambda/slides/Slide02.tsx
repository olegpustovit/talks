import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/02.svg?raw";

export function Slide02Slide() {
  return (
    <Slide title={"The API around the product"} hideTitle layout="wide" className="ruby-slide ruby-slide-02">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"02 / The need"}</p>
          <h2>{"The API around the product"}</h2>
          <p className="ruby-subtitle">{"The core service is running. The interface still needs a home."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["A core service", "Clients with small requests", "A thin application boundary"]} />
      </div>
      <SpeakerNote>
        <p>{"Imagine an early-stage team whose main product already runs on Puma, Fargate or Kubernetes. The missing piece is a small HTTP interface: authenticate a caller, validate a request, start a job, or return its status. Lambda is a candidate for this layer even when the main product stays where it is."}</p>
        <p>{"Personal automation has the same shape. The friend’s Shortcuts workflow calling a custom backup API is a motivating example, not a benchmark or a requirement to build a backup service. Use it briefly to make the need relatable, then follow the same illustrative API for the rest of the talk."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Introduce the already-running product."}</li>
          <li>{"Add its clients, without proposing a migration."}</li>
          <li>{"Name the small HTTP responsibilities."}</li>
        </ol>
      </SpeakerNote>
    </Slide>
  );
}
