import { Slide, SpeakerNote, useSceneClock } from "@talks/slide-engine";
import { HandlerApp } from "./companions/HandlerApp";

// Hooks live here: the deck calls slide functions directly to read titles and notes.
function HandlerLoop() {
  const t = useSceneClock(undefined, 8.2);
  return (
    <figure className="se-layered-diagram">
      <div className="se-layered-diagram-art"><HandlerApp t={t} /></div>
    </figure>
  );
}

export function HandlerAppSlide() {
  return (
    <Slide title={"Load the app once, call it per request"} hideTitle layout="wide" className="ruby-slide ruby-band ruby-slide-handler">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"13 / The handler"}</p>
          <h2>{"Load the app once, call it per request"}</h2>
          <p className="ruby-subtitle">{"Puma goes away. Sinatra stays. The copy pays for the boot once, then every request is a few milliseconds."}</p>
          <p className="ruby-footnote">{"* Illustrative cold starts, same caveats as slide 7. Measure Init Duration for both before quoting numbers."}</p>
        </div>
        <HandlerLoop />
      </div>
      <SpeakerNote>
        <p>{"Now the handler. It loops; I'll talk over it. The requires and App.new sit outside the method, so they run once, when the copy starts: that's Lambda's init phase. The app is Sinatra with Sequel; nothing in it knows about Lambda. Watch the chart on the right while that happens: the small app is done long before Rails would be."}</p>
        <p>{"Then per request it's three lines: event to env, call the app, response to hash. That's exactly what Puma used to do for us."}</p>
        <p>{"And on your laptop nothing changes: a three-line config.ru, rackup, Puma. Same App class."}</p>
        <p>{"This is why we drop Rails here: not because Rails can't run, it did on the earlier slides, but because a small app with fewer gems, no initializers and no eager load boots in a fraction of the time. We stop paying for metaprogramming and initialization that's hard to optimise at boot."}</p>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/ruby-handler.html" target="_blank" rel="noopener noreferrer">{"Lambda handler in Ruby"}</a></p>
        <p><a href="https://sinatrarb.com/" target="_blank" rel="noopener noreferrer">{"Sinatra"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
