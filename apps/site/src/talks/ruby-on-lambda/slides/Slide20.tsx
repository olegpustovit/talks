import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/20.svg?raw";

export function Slide20Slide() {
  return (
    <Slide title={"JIT and the first request"} hideTitle layout="wide" className="ruby-slide ruby-slide-20">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"20 / Beyond the runtime"}</p>
          <h2>{"JIT and the first request"}</h2>
          <p className="ruby-subtitle">{"Hot execution and startup are different parts of the path."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Loading and initialization", "Execution can become hot", "Startup remains a separate target"]} />
      </div>
      <SpeakerNote>
        <p>{"A just-in-time compiler can improve execution once code runs enough to become worth compiling. That is useful for reused environments and long-lived workloads. It does not automatically remove dependency loading or application initialization before the first handler invocation."}</p>
        <p>{"This question helps move from a lightweight Ruby app to the compiler experiment. Compare initialization, first invocation and steady-state handler time separately. Do not claim that JIT can never help Lambda or that warm-up always dominates: those are workload-dependent questions. The diagram is a causal timeline, not measured performance."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Highlight work before the first invocation."}</li>
          <li>{"Reveal repeated execution."}</li>
          <li>{"Return to the startup target."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
