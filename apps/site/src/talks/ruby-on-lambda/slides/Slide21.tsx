import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/21.svg?raw";

export function Slide21Slide() {
  return (
    <Slide title={"The language switch has a cost"} hideTitle layout="wide" className="ruby-slide ruby-slide-21">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"21 / Beyond the runtime"}</p>
          <h2>{"The language switch has a cost"}</h2>
          <p className="ruby-subtitle">{"Generation speed is only one part of the development loop."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Read and understand", "Edit, build and test", "Review and maintain"]} />
      </div>
      <SpeakerNote>
        <p>{"The Rust comparison is an intentional part of this talk. AI can produce a language the team does not know, but people still need to review the result, diagnose failures and own the system. Ruby developers have valuable reading and ecosystem fluency that belongs in the decision."}</p>
        <p>{"Measure compilation and iteration rather than assuming the outcome. Clean builds and a small incremental edit answer different questions. Rust may be a good choice for some workloads and teams. The question here is whether its startup or execution advantage for this API justifies the learning, build and maintenance costs for this Ruby team. Keep the critique specific to the experiment rather than attacking a language or person."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Start with understanding the code."}</li>
          <li>{"Time the build and test cycle."}</li>
          <li>{"Bring review ownership back into the loop."}</li>
        </ol>
      </SpeakerNote>
    </Slide>
  );
}
