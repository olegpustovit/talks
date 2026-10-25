import { CodeEditor, Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";

const CODE = `@workflow.defn
class HumanInTheLoopWorkflow:
    def __init__(self) -> None:
        self.decision: ApprovalDecision | None = None
        self.pending_request_id: str | None = None

    @workflow.signal
    async def approval_decision(
        self, decision: ApprovalDecision) -> None:
        if decision.request_id == self.pending_request_id:
            self.decision = decision

    @workflow.run
    async def run(self, request: AgentRequest) -> str:
        # ... call the model, decide the proposed
        # action is risky, set pending_request_id
        await workflow.wait_condition(
            lambda: self.decision is not None,
            timeout=timedelta(hours=24))
        if self.decision and self.decision.approved:
            return await workflow.execute_activity(
                take_action, request,
                start_to_close_timeout=timedelta(minutes=5))
        return "cancelled: no approval"`;

const SDKS = ["OpenAI Agents SDK", "LangGraph", "Google ADK", "Strands"];

function AgentHitl() {
  const { step } = useFrames([0, 1]);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="agent workflow · human_in_the_loop" />
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[0.85rem] font-bold tracking-tighter text-muted">SDK integrations · run as Temporal activities</p>
          <div className="flex flex-wrap gap-2">
            {SDKS.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </div>
        </div>
        <div className={["flex flex-col gap-2 transition-opacity duration-500", step === 1 ? "opacity-100" : "opacity-0"].join(" ")}>
          <p className="m-0 text-[clamp(1.05rem,1.9cqw,1.35rem)] leading-snug font-bold tracking-tighter">
            A checkpointer alone can't tell "the process crashed" from "a person hasn't answered yet."
          </p>
          <p className="m-0 text-[0.95rem] leading-snug text-muted">
            Both resume the same thread. Durable execution can tell them apart, because it's a
            property of how the agent runs, not how it's written — and you keep the graph.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AIAgentsSlide() {
  return (
    <Slide title="An agent's approval is a durable wait" kicker="AI agents on Temporal" layout="wide">
      <AgentHitl />
      <SpeakerNote>
        <p className="font-bold">24 An agent's approval is a durable wait / 33:00–34:15 / 1:15</p>
        <p className="italic">Same shape as slide 17 — say that out loud before revealing the second half.</p>
        <p>
          Agent frameworks all hit the same wall eventually: a tool call needs a human to approve
          it, and that human might take five minutes or three days. This is from Temporal's own AI
          Cookbook. A signal carries the decision in. wait_condition with a 24-hour timeout is the
          same durable wait we built for KYC review — no thread held, no worker memory, a timer row.
        </p>
        <p>
          You don't have to hand-roll this against a bare LLM client. temporalio.contrib ships
          integrations for the OpenAI Agents SDK, LangGraph, Google's ADK, and AWS's Strands — each
          turns that framework's tool calls and graph nodes into Temporal activities. For LangGraph
          specifically, your StateGraph or @entrypoint/@task functions keep working; the plugin runs
          the nodes as activities underneath them.
        </p>
        <p className="italic">Press Next. Read both lines, then pause before "and you keep the graph."</p>
        <p>
          Here's the honest comparison. LangGraph's checkpointer is real and it works — it's how
          interrupt() survives a restart. But a Manetu engineering post on Temporal's blog makes the
          sharp point: human-in-the-loop resume and crash-recovery resume look identical from the
          outside, and a checkpointer alone can't distinguish them. Temporal can, because durability
          is a property of the runtime, not a pattern you have to get right in your own code. And
          contrib.langgraph doesn't ask you to leave LangGraph — it runs underneath it.
        </p>
        <p>Honest cost: these contrib packages are explicitly marked experimental by Temporal. Check their status before betting a production agent on one.</p>
      </SpeakerNote>
    </Slide>
  );
}
