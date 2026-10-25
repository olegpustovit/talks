import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { BareHandler } from "./companions/BareHandler";

export function BackToBasicsSlide() {
  return (
    <Slide title={"A handler is one Ruby method"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-basics">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"09 / Back to basics"}</p>
          <h2>{"A handler is one Ruby method"}</h2>
          <p className="ruby-subtitle">{"Lambda calls a method with an event hash and wants a hash back. That's the whole interface."}</p>
          <p className="ruby-footnote">{"* Function URLs and API Gateway HTTP APIs send payload format 2.0. The handler is configured as file.method; here, handler.handler."}</p>
        </div>
        <SteppedScene cues={["Lambda hands your method an event", "It returns a plain hash"]} still={3} wideFrom={1}>
          {(t, step, since) => <BareHandler t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"So maybe we rethink this. The free computers are still useful; what's slow is everything we brought with us. Let's go back to basics: how does the Ruby part actually work?"}</p>
        <p>{"Lambda's Ruby runtime loads one file and calls one method. On the left is the event, the request as AWS describes it: JSON with rawPath, headers, the HTTP method tucked under requestContext. Our method reads it like any hash; here, the order id from the path."}</p>
                <p>{"Press. And it returns a plain hash: statusCode, headers, body. Lambda turns that into the HTTP response. No framework, no server. This file boots in milliseconds."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"The event goes in; the handler reads it like a hash."}</li>
          <li>{"It returns statusCode, headers, body."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/ruby-handler.html" target="_blank" rel="noopener noreferrer">{"Lambda handler in Ruby"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Lambda function URL payload format"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
