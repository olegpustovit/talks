import { LayeredDiagram, Slide, SpeakerNote } from "@talks/slide-engine";
import diagram from "../assets/16.svg?raw";

export function Slide16Slide() {
  return (
    <Slide title={"The data store sets the boundary"} hideTitle layout="wide" className="ruby-slide ruby-slide-16">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"16 / Designing the application"}</p>
          <h2>{"The data store sets the boundary"}</h2>
          <p className="ruby-subtitle">{"AWS service APIs and private SQL imply different infrastructure."}</p>
        </div>
        <LayeredDiagram svg={diagram} cues={["DynamoDB, S3 and SQS via SDK and IAM", "Private RDS through a VPC path", "Internet egress is a separate decision"]} />
      </div>
      <SpeakerNote>
        <p>{"A serverless application can use DynamoDB, S3 and SQS through the Ruby AWS SDK and scoped IAM permissions without attaching the function to a customer VPC. That is one simple topology, not a requirement that every existing SQL application migrate to DynamoDB."}</p>
        <p>{"For private RDS, give the function an appropriate VPC path, security groups and a connection strategy. RDS access alone does not require NAT. Internet access from a VPC-connected function is a separate routing question; S3 and DynamoDB gateway endpoints can avoid NAT for those services. Attaching Lambda to a public subnet does not assign it a public IP. Do not present public database exposure as the cheap default."}</p>
        <p>{"This is where an established Ruby application may reasonably keep an endpoint on Puma. The right boundary depends on data access and operations, not on language fashion."}</p>
        <h3>Reveal cues</h3>
        <ol>
          <li>{"Trace the service API option."}</li>
          <li>{"Reveal the private SQL boundary."}</li>
          <li>{"Separate database access from internet egress."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html" target="_blank" rel="noopener noreferrer">{"Lambda VPC internet access"}</a></p>
        <p><a href="https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html" target="_blank" rel="noopener noreferrer">{"S3 and DynamoDB gateway endpoints"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
