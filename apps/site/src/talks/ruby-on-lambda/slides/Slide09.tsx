import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/09.svg?raw";

export function Slide09Slide() {
  return (
    <Slide title={"The bare Ruby handler"} hideTitle layout="wide" className="ruby-slide ruby-slide-09">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"09 / Inside Lambda"}</p>
          <h2>{"The bare Ruby handler"}</h2>
          <p className="ruby-subtitle">{"An event in. A serializable result out."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Load code once per environment", "Handle each invocation", "Return an HTTP envelope"]} />
      </div>
      <SpeakerNote>
        <p>{"Show how little code is necessary to answer one HTTP event. The example returns a status code, lower-case content-type and a serialized body. It is an illustrative response for a Lambda Function URL or compatible HTTP integration, not the entire application."}</p>
        <p>{"Code outside the handler is loaded with the environment; the handler runs for each invocation. Initialize reusable clients deliberately, without making correctness depend on environment reuse. We have proved we can return a response, but writing every route, cookie and request parser against AWS’s event shape would be an awkward application interface. That creates the need for Rack."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Read the file from require to handler."}</li>
          <li>{"Identify the per-invocation work."}</li>
          <li>{"Point out the response envelope."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html" target="_blank" rel="noopener noreferrer">{"Function URL event and response format"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
