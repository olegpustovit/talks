import { LoopedScene, Slide, SpeakerNote } from "@talks/slide-engine";
import { RackContract } from "./companions/RackContract";

export function RackContractSlide() {
  return (
    <Slide title={"Rack is the contract between server and app"} hideTitle layout="wide" className="ruby-slide ruby-wide ruby-slide-rack">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"10 / Rack"}</p>
          <h2>{"Rack is the contract between server and app"}</h2>
          <p className="ruby-subtitle">{"Puma turns HTTP into a hash. The app answers with three things. Either side can be swapped."}</p>
        </div>
        <LoopedScene cues={["Puma turns HTTP into an env hash", "The app is anything with call(env)", "It answers status, headers, body", "Swap the server, keep the app"]} beat={4} still={13}>
          {(t, step, since) => <RackContract t={t} step={step} since={since} />}
        </LoopedScene>
      </div>
      <SpeakerNote>
        <p>{"But we don't want to write apps against AWS's JSON. Thankfully Ruby has Rack, the specification that decouples servers from frameworks."}</p>
        <p>{"Puma's job is to take HTTP off the socket and turn it into an env hash: REQUEST_METHOD, PATH_INFO, QUERY_STRING, HTTP_ headers, and rack.input for the body."}</p>
        <p>{"A Rack app is anything that responds to call(env). That's it. This class is a complete one."}</p>
        <p>{"It answers with an array of three: status, headers, body. Puma writes that back to the socket."}</p>
        <p>{"Rails, Sinatra, Roda, Hanami: all Rack apps. Which means the server side is swappable. If something else can build that env hash, our app doesn't care where it runs."}</p>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
