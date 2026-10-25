import { Slide, SpeakerNote, useSceneClock } from "@talks/slide-engine";
import { AgentDeploy } from "./companions/AgentDeploy";

// Hooks live here: the deck calls slide functions directly to read titles and notes.
function DeployLoop() {
  const t = useSceneClock(undefined, 8.3);
  return (
    <figure className="se-layered-diagram">
      <div className="se-layered-diagram-art"><AgentDeploy t={t} /></div>
    </figure>
  );
}

export function AgentDeploySlide() {
  return (
    <Slide title={"Your deploy can be a skill an agent runs"} hideTitle layout="wide" className="ruby-slide ruby-caption ruby-slide-agent">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"17 / Deploying in 2026"}</p>
          <h2>{"Your deploy can be a skill an agent runs"}</h2>
          <p className="ruby-subtitle">{"The AWS CLI is the real interface; every tool wraps it, and agents drive it best. Keep the recipe in the repo, review it like code."}</p>
        </div>
        <DeployLoop />
      </div>
      <SpeakerNote>
        <p>{"And the 2026 version. Everything we just compared, CDK, Terraform, the console, ends up calling the same AWS APIs. The CLI is the most direct way to call them, and it's also what coding agents are best at."}</p>
        <p>{"So for a small project, the deploy can be a skill: a markdown file in the repo that says how this project ships. Check which account you're in. Build the gems in the Lambda build image. Upload, wait, publish a version, move the live alias. Smoke test, and if it fails, move the alias back. Invalidate the assets."}</p>
        <p>{"Watch the loop: every command the agent types touches one thing, and you can see which. Version 42 appears, live moves to it, the smoke test passes. Rollback isn't a redeploy; it's moving that pointer back to 41."}</p>
        <p>{"The honest cost: there's no state file and no plan. The skill has to read before it writes, it should never create or delete resources on its own, and you review the skill the way you'd review Terraform. For creating the infrastructure in the first place, I'd still use Terraform. For shipping code every day, this is faster and easier to read."}</p>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/cli/latest/reference/lambda/" target="_blank" rel="noopener noreferrer">{"AWS CLI: lambda commands"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html" target="_blank" rel="noopener noreferrer">{"Lambda aliases"}</a></p>
        <p><a href="https://docs.claude.com/en/docs/claude-code/skills" target="_blank" rel="noopener noreferrer">{"Agent skills"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
