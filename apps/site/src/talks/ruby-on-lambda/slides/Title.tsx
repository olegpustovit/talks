import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/01.svg?raw";

export function TitleSlide() {
  return (
    <Slide title={"Running Ruby apps on AWS Lambda"} hideTitle layout="wide" className="ruby-slide ruby-slide-01">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"01 / The need"}</p>
          <h2>{"Running Ruby apps on AWS Lambda"}</h2>
          <p className="ruby-subtitle">{"A small API. A familiar language. A different place to run it."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["A useful interface", "A small Ruby app", "A deployment worth understanding"]} />
      </div>
      <SpeakerNote>
        <p>{"Open on the need, rather than on an AWS feature list. A shortcut needs an endpoint, a frontend needs a backend, or an agent needs an action it can call. These are small applications that still deserve familiar routing, authentication and tests."}</p>
        <p>{"The promise is practical: keep the Ruby code you can read and maintain, then investigate what changes when it runs on Lambda. The talk follows one application through that investigation. The final compiler experiment asks how far we can take startup performance while keeping Ruby."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Let the clients appear before naming Lambda."}</li>
          <li>{"Follow one request into the Ruby API."}</li>
          <li>{"State the promise and move to the problem."}</li>
        </ol>
      </SpeakerNote>
    </Slide>
  );
}
