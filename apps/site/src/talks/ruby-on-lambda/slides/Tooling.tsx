import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Tooling } from "./companions/Tooling";

export function ToolingSlide() {
  return (
    <Slide title={"Deploy with a plan you can read"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-tooling">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"16 / Deploying it"}</p>
          <h2>{"Deploy with a plan you can read"}</h2>
          <p className="ruby-subtitle">{"AWS will point you at CDK on CloudFormation. I wouldn't: you review a template nobody wrote, and a failed update can leave the stack stuck."}</p>
          <p className="ruby-footnote">{"* Illustrative: the template synthesized for this stack runs to several hundred lines; the exact count depends on the CDK version and constructs."}</p>
        </div>
        <SteppedScene cues={["CDK: nine lines to write, a wall to review", "Terraform: the plan is the diff"]} still={6} wideFrom={1}>
          {(t, step, since) => <Tooling t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Now we have to deploy it. Ask anyone at AWS and they'll say CDK, which generates CloudFormation. Here are nine lines of CDK: a Ruby function and an upload of our public folder."}</p>
        <p>{"cdk synth turns that into the template CloudFormation actually runs. Hundreds of lines. And in it, things none of us wrote: BucketDeployment brings its own Lambda function, with a layer that contains the AWS CLI. IAM roles and policies for both. Parameters that only exist because of the CDK bootstrap stack. That's what you'd have to review."}</p>
        <p>{"Then an update fails halfway. CloudFormation rolls back, the rollback fails, and the stack sits in UPDATE_ROLLBACK_FAILED until someone fixes the resource by hand and runs continue-update-rollback. It's slow, and it's hard to audit."}</p>
        <p>{"Press. Terraform, or OpenTofu if you want the open-source fork. It calls the AWS APIs directly; there's no stack in the middle to get stuck. And before anything happens, terraform plan tells you what will change: memory from 512 to 1024, new code. Seven lines. That's the diff your team approves."}</p>
        <p>{"The honest cost: Terraform keeps state, and that file is now yours. Lock it, back it up, don't edit it by hand."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"CDK synthesizes a wall; a failed update gets stuck."}</li>
          <li>{"Terraform's plan: seven lines, the actual change."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html#troubleshooting-errors-update-rollback-failed" target="_blank" rel="noopener noreferrer">{"CloudFormation: UPDATE_ROLLBACK_FAILED"}</a></p>
        <p><a href="https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_deployment-readme.html" target="_blank" rel="noopener noreferrer">{"CDK BucketDeployment (custom resource and CLI layer)"}</a></p>
        <p><a href="https://developer.hashicorp.com/terraform/cli/commands/plan" target="_blank" rel="noopener noreferrer">{"terraform plan"}</a> · <a href="https://opentofu.org/" target="_blank" rel="noopener noreferrer">{"OpenTofu"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
