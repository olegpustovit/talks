import { Slide, SpeakerNote, SilkField } from "@talks/slide-engine";

export function TitleSlide() {
  return (
    <Slide title={"Running Ruby apps on AWS Lambda"} hideTitle layout="wide" className="ruby-slide ruby-slide-01">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"01 / The need"}</p>
          <h2>{"Running Ruby apps"}<br />{"on AWS Lambda"}</h2>
          <p className="ruby-subtitle">{"Same Rack app. Boot time is now latency."}</p>
        </div>
        <div className="ruby-threads">
          <SilkField label="Hundreds of coloured strands, combed straight at the left, billowing and folding to the right like silk in a slow current" />
        </div>
      </div>
      <SpeakerNote>
        <p>{"Open on the need, rather than on an AWS feature list. A shortcut needs an endpoint, a frontend needs a backend, or an agent needs an action it can call. The strands on the right are those requests: orderly where they come in, then pulled every way by the traffic. The closing slide shows the same strands. These are small applications that still deserve familiar routing, authentication and tests."}</p>
        <p>{"The promise is practical: keep the Ruby code you can read and maintain, then investigate what changes when it runs on Lambda. The subtitle is the catch: when the process can start on a request, boot time stops being a deploy detail and becomes latency. The talk follows one application through that investigation. The final compiler experiment asks how far we can take startup performance while keeping Ruby."}</p>
      </SpeakerNote>
    </Slide>
  );
}
