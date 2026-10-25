import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/14.svg?raw";

export function Slide14Slide() {
  return (
    <Slide title={"A familiar app in either place"} hideTitle layout="wide" className="ruby-slide ruby-slide-14">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"14 / The Rack boundary"}</p>
          <h2>{"A familiar app in either place"}</h2>
          <p className="ruby-subtitle">{"Local Puma. Deployed Lambda. The same Ruby boundary."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["A lightweight Rack application", "Local requests through Puma", "Deployed requests through the adapter"]} />
      </div>
      <SpeakerNote>
        <p>{"Use a lightweight Rack application, such as Sinatra, to restore routing and middleware without automatically restoring the entire Rails boot path. The point is choosing what this workload needs, not proving that the smallest framework always wins."}</p>
        <p>{"Run it locally through Puma and exercise ordinary HTTP or Rack tests. Deploy the same application behind the Lambda adapter and check the integration separately. Local tests cannot prove IAM permissions, event translation, real startup behavior or network access. Docker is useful for build compatibility when needed, but local development need not become a full cloud simulation."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Show the application in the middle."}</li>
          <li>{"Send its local request."}</li>
          <li>{"Send the corresponding deployed request."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/rack/rack/blob/main/SPEC.rdoc" target="_blank" rel="noopener noreferrer">{"Rack specification"}</a></p>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"How Lamby works"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
