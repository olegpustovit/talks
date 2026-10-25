import { Slide, SpeakerNote, useSceneClock } from "@talks/slide-engine";
import { EventToEnv } from "./companions/EventToEnv";

// Hooks live here: the deck calls slide functions directly to read titles and notes.
function MappingLoop() {
  const t = useSceneClock(undefined, 2.6);
  return (
    <figure className="se-layered-diagram">
      <div className="se-layered-diagram-art"><EventToEnv t={t} /></div>
    </figure>
  );
}

export function EventToEnvSlide() {
  return (
    <Slide title={"Every Rack key is already in the event"} hideTitle layout="wide" className="ruby-slide ruby-caption ruby-slide-event-env">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"11 / The mapper"}</p>
          <h2>{"Every Rack key is already in the event"}</h2>
          <p className="ruby-subtitle">{"So we don't need Puma. We need a mapper: a field-by-field copy from Lambda's JSON to Rack's hash."}</p>
        </div>
        <MappingLoop />
      </div>
      <SpeakerNote>
        <p>{"Put the two side by side: Lambda's event on the left, the Rack env on the right. Let it loop."}</p>
        <p>{"The method comes from requestContext.http. PATH_INFO is rawPath. QUERY_STRING is rawQueryString. SERVER_NAME is the host header. Every other header becomes HTTP_ something. The body becomes rack.input. And a few keys are constants on Lambda: no script name, port 443, HTTPS."}</p>
        <p>{"Nothing here needs a server. It's a copy. So let's write it."}</p>
      </SpeakerNote>
    </Slide>
  );
}
