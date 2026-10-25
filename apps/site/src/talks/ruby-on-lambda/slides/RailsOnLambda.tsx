import { Slide, SpeakerNote, useSceneClock } from "@talks/slide-engine";
import { Temptation } from "./companions/Temptation";

// Hooks live here: the deck calls slide functions directly to read titles and notes.
function TemptationLoop() {
  const t = useSceneClock(undefined, 5);
  return (
    <figure className="se-layered-diagram">
      <div className="se-layered-diagram-art"><Temptation t={t} /></div>
      <figcaption><span>The same app, out of the box, from zero to many copies and back</span></figcaption>
    </figure>
  );
}

export function RailsOnLambdaSlide() {
  return (
    <Slide title={"So just put Rails on Lambda"} hideTitle layout="wide" className="ruby-slide ruby-slide-temptation">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"06 / The temptation"}</p>
          <h2>{"So just put Rails on Lambda"}</h2>
          <p className="ruby-subtitle">{"Same app, no box. It scales out with traffic and back down to nothing."}</p>
        </div>
        <TemptationLoop />
      </div>
      <SpeakerNote>
        <p>{"So the internet is solved and serverless is the future. Funny thing to say in 2026, but stay with me. If Lambda is this good, why keep Linux boxes at all? Forget the monolith on servers, the DHH and 37signals way, and take the Rails app as it is."}</p>
        <p>{"Watch the loop. The app sits in a box that's on all day. It leaves the box and lands in a Lambda function, then traffic arrives and Lambda runs more copies of it, all talking to RDS. Traffic goes away and so do the copies, down to zero."}</p>
        <p>{"No steps here; let it loop while you say it. Then: let's see what the first request actually costs."}</p>
      </SpeakerNote>
    </Slide>
  );
}
