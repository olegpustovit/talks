import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/22.svg?raw";

export function Slide22Slide() {
  return (
    <Slide title={"Ruby compiled ahead of time"} hideTitle layout="wide" className="ruby-slide ruby-slide-22">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"22 / Beyond the runtime"}</p>
          <h2>{"Ruby compiled ahead of time"}</h2>
          <p className="ruby-subtitle">{"Spinel moves work into the build."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Ruby source through inference and C generation", "A native executable", "A custom runtime on Lambda"]} />
      </div>
      <SpeakerNote>
        <p>{"Introduce Spinel by Matz as an ahead-of-time compiler for supported Ruby programs. It infers types, emits C, and uses a C compiler to build an executable. This offers a different experiment: retain Ruby source while changing what must happen at startup."}</p>
        <p>{"The working prototype already exists. It is not a future implementation task. A custom Lambda runtime can provide the invocation loop around the executable. This is separate from Lamby’s Rack translation and does not establish that Sinatra, Rails or arbitrary gems compile unchanged. State the supported subset and dependencies in the pinned prototype. Treat native modules or mixed execution as possible directions rather than capabilities automatically supplied by whole-program compilation."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Follow the Ruby source at build time."}</li>
          <li>{"Show the native artifact."}</li>
          <li>{"Skip compilation during invocation."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/matz/spinel" target="_blank" rel="noopener noreferrer">{"Spinel compiler"}</a></p>
        <p><a href="https://github.com/matz/spinel/blob/master/docs/limitations.md" target="_blank" rel="noopener noreferrer">{"Spinel limitations"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html" target="_blank" rel="noopener noreferrer">{"Custom runtime contract"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
