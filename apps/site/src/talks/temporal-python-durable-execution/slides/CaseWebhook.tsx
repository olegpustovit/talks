import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, StepRow, useLoopFrames, type StepState } from "@talks/slide-engine";
import { at } from "../caseCode";

const CODE = `REJECT = WorkflowIDReusePolicy.REJECT_DUPLICATE

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    event = verify_signature(
        await request.body(), request.headers)
    try:
        await temporal.start_workflow(
            HandlePayment.run, event["id"],
            id=f"stripe-{event['id']}",
            task_queue="webhooks",
            id_reuse_policy=REJECT)
    except WorkflowAlreadyStartedError:
        pass
    return {"received": True}`;

const DELIVERIES = [
  { label: "#1 POST /webhooks/stripe", result: "200 · 38 ms" },
  { label: "#2 same event, again", result: "200 · already started" },
];

const STEPS = [
  { label: "fetch_event", detail: "invoice.paid" },
  { label: "grant_access", detail: "Pro plan" },
  { label: "send_receipt", detail: "receipt sent" },
];

type Frame = {
  lines: number[];
  deliveries: number;
  runs: number;
  steps: StepState[];
  receipt?: string;
  duplicate?: boolean;
  status: string;
  ms?: number;
};

const HANDLE = [...at(CODE, "verify_signature", 2), ...at(CODE, "start_workflow", 5), ...at(CODE, "return {")];
const DEDUPE = [...at(CODE, "REJECT ="), ...at(CODE, 'id=f"stripe-'), ...at(CODE, "id_reuse_policy"), ...at(CODE, "except WorkflowAlreadyStartedError", 2)];

const FRAMES: Frame[] = [
  { lines: [], deliveries: 0, runs: 0, steps: ["idle", "idle", "idle"], status: "Stripe sends invoice.paid, event evt_3Q9x." },
  { lines: HANDLE, deliveries: 1, runs: 1, steps: ["active", "idle", "idle"], status: "Verify it, start a workflow named after the event, return 200." },
  { lines: [], deliveries: 1, runs: 1, steps: ["done", "active", "idle"], status: "The work happens in the workflow, not in the request." },
  { lines: DEDUPE, deliveries: 2, runs: 1, steps: ["done", "done", "idle"], duplicate: true, status: "Stripe sends evt_3Q9x again. Same workflow ID, so it's already started. Still 200.", ms: 3200 },
  { lines: [], deliveries: 2, runs: 1, steps: ["done", "done", "active"], receipt: "503 · retrying", status: "The email provider returns 503. The activity retries by itself." },
  { lines: [], deliveries: 2, runs: 1, steps: ["done", "done", "done"], status: "Two deliveries, one run. No processed_events table." },
];

function Delivery({ label, result, shown, duplicate }: { label: string; result: string; shown: boolean; duplicate: boolean }) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 px-2 py-1.5 font-mono text-[0.8rem] transition-all duration-500",
        shown ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
        duplicate ? "bg-accent text-accent-fg" : "bg-bg",
      ].join(" ")}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 font-bold">{result}</span>
    </div>
  );
}

function Webhooks({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="Stripe → api.shop.com" meta="evt_3Q9x" status={frame.status}>
      <div className="flex gap-2">
        <Stat label="Deliveries" value={frame.deliveries} accent={frame.duplicate} />
        <Stat label="Workflow runs" value={frame.runs} />
      </div>
      <div className="flex flex-col gap-1">
        {DELIVERIES.map((delivery, i) => (
          <Delivery key={delivery.label} {...delivery} shown={i < frame.deliveries} duplicate={i === 1 && Boolean(frame.duplicate)} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="m-0 font-mono text-[0.8rem] font-bold text-muted">workflow stripe-evt_3Q9x</p>
        {STEPS.map((step, i) => (
          <StepRow key={step.label} label={step.label} detail={i === 2 && frame.receipt ? frame.receipt : step.detail} state={frame.steps[i]!} />
        ))}
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="api/webhooks.py" highlightLines={frame.lines} />
      <Webhooks frame={frame} />
    </div>
  );
}

export function CaseWebhookSlide() {
  return (
    <Slide title="A retried webhook can't run twice" kicker="Case study · Stripe webhooks" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">15 A retried webhook can't run twice / 21:45–23:00 / 1:15</p>
        <p>Second: webhooks. Stripe's docs say an endpoint can receive the same event more than once. The usual fix is a processed_events table and a queue someone watches.</p>
        <p>Here the handler does almost nothing. Verify the signature, start a workflow whose ID is the event ID, and return 200 in milliseconds.</p>
        <p>When Stripe sends the same event again, starting a workflow with that ID raises WorkflowAlreadyStartedError. We ignore it and return 200. The workflow ID is the dedupe table.</p>
        <p>REJECT_DUPLICATE matters once the first run has finished. With the default policy, a closed workflow's ID can be reused and the event would run again. The test file checks both.</p>
        <p>The receipt email gets a 503. It's an activity, so it retries on its own.</p>
        <p>Honest cost: dedupe by ID lasts only as long as the namespace keeps closed workflows, its retention period. The activities still need idempotency keys for their own retries. Pass the event ID, not the payload, and fetch the object inside an activity.</p>
        <p>Transition: four more, quickly. Same shape every time.</p>
      </SpeakerNote>
    </Slide>
  );
}
