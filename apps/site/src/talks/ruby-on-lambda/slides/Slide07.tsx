import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/07.svg?raw";

export function Slide07Slide() {
  return (
    <Slide title={"Before the handler runs"} hideTitle layout="wide" className="ruby-slide ruby-slide-07">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"07 / Inside Lambda"}</p>
          <h2>{"Before the handler runs"}</h2>
          <p className="ruby-subtitle">{"Startup work can dominate a small request."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Runtime, dependencies, application boot", "Inspect the initialization path", "Compare a reused environment"]} />
      </div>
      <SpeakerNote>
        <p>{"Break down the cold initialization path into runtime setup, loading dependencies, framework boot and initializers. A typical Rails application may load far more code than a small endpoint needs; show the dependency or startup trace from the actual application rather than asserting a universal module count."}</p>
        <p>{"Compare this with a reused environment and with the familiar long-running Puma process, which amortizes boot over requests. Lambda does not cold-start on every request. Additional environments can introduce new initialization during scale-out. Provisioned concurrency prepares environments, while reserved concurrency allocates and caps concurrency without warming them. These distinctions support the experiment without taking over the story."}</p>
        <p>{"The diagram shows phase order only. It intentionally has no invented durations. Use the existing baseline trace in the live demonstration."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Trace the cold path left to right."}</li>
          <li>{"Locate the framework work before useful handling."}</li>
          <li>{"Reveal the shorter reused path."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html" target="_blank" rel="noopener noreferrer">{"Lambda concurrency"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
