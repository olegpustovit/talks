import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/19.svg?raw";

export function Slide19Slide() {
  return (
    <Slide title={"A complete serverless application"} hideTitle layout="wide" className="ruby-slide ruby-slide-19">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"19 / Designing the application"}</p>
          <h2>{"A complete serverless application"}</h2>
          <p className="ruby-subtitle">{"A frontend can use a Ruby API backed by managed services."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["A coherent HTTP entry point", "Data and objects in managed services", "Work crosses a durable queue"]} />
      </div>
      <SpeakerNote>
        <p>{"Bring the pieces together. A frontend calls the Ruby API. The application controls its routes and authentication, uses DynamoDB for suitable access patterns, and authorizes direct S3 uploads. Jobs cross a queue into a worker or into the product’s existing core service."}</p>
        <p>{"The frontend might use an OpenNext deployment in an SST-based application. That does not force the Ruby code to move to another language. Equally, this architecture does not imply moving robotics or other long-running product workloads into request handlers. The small API boundary is valuable in a hybrid application and can also be the basis of a completely serverless product."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Follow one frontend call."}</li>
          <li>{"Add storage operations."}</li>
          <li>{"Hand off a job and return to the product boundary."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://sst.dev/docs/component/aws/function/" target="_blank" rel="noopener noreferrer">{"SST Function runtime support"}</a></p>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
