import { LoopedScene, Slide, SpeakerNote } from "@talks/slide-engine";
import { Mapper } from "./companions/Mapper";

export function MapperSlide() {
  return (
    <Slide title={"The whole adapter is forty lines"} hideTitle layout="wide" className="ruby-slide ruby-wide ruby-slide-mapper">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"12 / The mapper"}</p>
          <h2>{"The whole adapter is forty lines"}</h2>
          <p className="ruby-subtitle">{"Read the event, fill the env, map the headers, wrap the response."}</p>
          <p className="ruby-footnote">{"* lamby does this in production and covers more: cookies, multi-value headers, binary responses, API Gateway REST and ALB events."}</p>
        </div>
        <LoopedScene cues={["Read the event", "Fill in what Rack requires", "Headers become HTTP_*", "The triple becomes a hash"]} beat={4.5} still={14.5}>
          {(t, step, since) => <Mapper t={t} step={step} since={since} />}
        </LoopedScene>
      </div>
      <SpeakerNote>
        <p>{"Here's the whole thing. One module, two methods."}</p>
        <p>{"First, read the event: the http section, the headers, and the body, decoded if Lambda sent it base64-encoded."}</p>
        <p>{"Then the keys the Rack spec requires. Most come straight from the event; on Lambda the port, the scheme and the protocol are always the same."}</p>
        <p>{"Headers: upcase, dashes to underscores, prefix with HTTP_. Content-Type and Content-Length keep their CGI names, that's the spec."}</p>
        <p>{"And the way back: read the body, close it if it can be closed, and return the hash Lambda wants. Around forty lines. lamby is the production version of this, with cookies, binary responses and other event sources."}</p>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
        <p><a href="https://lamby.cloud/" target="_blank" rel="noopener noreferrer">{"Lamby"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
