import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/18.svg?raw";

export function Slide18Slide() {
  return (
    <Slide title={"The app includes infrastructure"} hideTitle layout="wide" className="ruby-slide ruby-slide-18">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"18 / Designing the application"}</p>
          <h2>{"The app includes infrastructure"}</h2>
          <p className="ruby-subtitle">{"SST makes the relationships part of one definition."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["Package the Ruby application", "Connect resources and permissions", "Deploy an identifiable stage"]} />
      </div>
      <SpeakerNote>
        <p>{"This is why SST belongs in the talk, rather than in a closing tooling aside. The useful unit is the application plus its endpoint, storage, queues, permissions and outputs. Show those relationships in one app definition, then show how a stage reaches the deployed endpoint."}</p>
        <p>{"Treat developer friendliness as the reason for your choice and demonstrate it. Avoid a universal claim that SST is better than Terraform. Its documented Function support currently lists Node and Go, with community Python and Rust support, rather than first-class Ruby. Show the actual Ruby packaging and deployment path you use, such as explicit AWS/Pulumi Lambda resources for a built package or image. Do not imply a native Ruby runtime option or identical sst dev behavior without a working integration."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Begin with the definition and package."}</li>
          <li>{"Connect the endpoint."}</li>
          <li>{"Add storage, queue, IAM and logs."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://sst.dev/docs/component/aws/function/" target="_blank" rel="noopener noreferrer">{"SST Function runtime support"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
