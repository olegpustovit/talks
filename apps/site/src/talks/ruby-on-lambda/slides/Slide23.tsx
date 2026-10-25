import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/23.svg?raw";

export function Slide23Slide() {
  return (
    <Slide title={"The prototype already runs"} hideTitle layout="wide" className="ruby-slide ruby-slide-23">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"23 / Beyond the runtime"}</p>
          <h2>{"The prototype already runs"}</h2>
          <p className="ruby-subtitle">{"Startup is one result. Iteration deserves the same scrutiny."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["A measured working prototype", "A result with a defined scope", "A fair Ruby, Rust and Spinel comparison"]} />
      </div>
      <SpeakerNote>
        <p>{"In our rehearsal discussion, the presenter reported a working ahead-of-time prototype with startup under nine milliseconds. Preserve that as a presenter-reported observation. When presenting this result, distinguish the prototype timer boundary from AWS Init Duration and end-to-end HTTP latency. State the environment used for the recorded measurement."}</p>
        <p>{"When speaking, use the existing recording or logs and say exactly what was timed. For the planned comparison, use the same endpoint and equivalent behavior across Ruby, Rust and Spinel. Record architecture, memory, runtime or compiler revision, dependencies and deployment configuration. Compare cold startup and warm execution alongside clean build time and edit-to-test time. Report repeated runs and variation. Do not invent missing Rust results or claim C or Rust parity from this single startup figure."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Show the reported prototype result."}</li>
          <li>{"Name the timer boundary when replaying the evidence."}</li>
          <li>{"Open the full development-loop comparison."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/matz/spinel" target="_blank" rel="noopener noreferrer">{"Spinel compiler"}</a></p>
        <p><a href="https://github.com/matz/spinel/blob/master/docs/limitations.md" target="_blank" rel="noopener noreferrer">{"Spinel limitations"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
