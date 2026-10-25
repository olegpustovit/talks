import { CodeEditor, ScenePanel, Slide, SpeakerNote, StepRow, Tag, useLoopFrames, type StepState } from "@talks/slide-engine";
import { at, caseSnippet } from "../caseCode";

const CODE = caseSnippet("review");

type Frame = {
  lines: number[];
  ticket: StepState;
  hours: number;
  round: 1 | 2;
  escalated: boolean;
  approved: boolean;
  status: string;
  ms?: number;
};

const WAIT = at(CODE, "while self.decision", 5);

const FRAMES: Frame[] = [
  { lines: [], ticket: "idle", hours: 0, round: 1, escalated: false, approved: false, status: "The ID vendor can't match the passport photo. A person has to look." },
  { lines: at(CODE, "open_review_ticket,", 2, -1), ticket: "done", hours: 0, round: 1, escalated: false, approved: false, status: "open_review_ticket puts A-2291 in the review queue." },
  { lines: WAIT, ticket: "done", hours: 20, round: 1, escalated: false, approved: false, status: "Nobody looks. The workflow waits: no thread, no worker memory, just a timer." },
  { lines: WAIT, ticket: "done", hours: 48, round: 1, escalated: false, approved: false, status: "48 hours pass.", ms: 2000 },
  { lines: at(CODE, "except asyncio.TimeoutError", 3), ticket: "done", hours: 48, round: 1, escalated: true, approved: false, status: "Timeout. escalate_to_lead pings the compliance lead.", ms: 2600 },
  { lines: WAIT, ticket: "done", hours: 6, round: 2, escalated: true, approved: false, status: "Back to waiting, with a fresh 48 hours." },
  { lines: at(CODE, "@workflow.update", 4), ticket: "done", hours: 6, round: 2, escalated: true, approved: true, status: "The lead clicks Approve. The update sets decision and answers the button." },
  { lines: at(CODE, "return self.decision"), ticket: "done", hours: 6, round: 2, escalated: true, approved: true, status: 'wait_condition wakes up. run returns "approved".' },
];

const BORDER = { borderWidth: "var(--se-border-width)" } as const;

function ReviewQueue({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="Compliance · review queue" meta="SLA 48 h" status={frame.status}>
      <div className="flex items-center gap-3 bg-bg px-3 py-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-fg font-bold text-bg">A</div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-bold tracking-tighter">Applicant A-2291</p>
          <p className="m-0 truncate text-[0.85rem] text-muted">Vendor: photo doesn't match</p>
        </div>
        <Tag accent={frame.approved}>{frame.approved ? "approved" : frame.ticket === "done" ? "in queue" : "new"}</Tag>
      </div>
      <StepRow label="open_review_ticket" detail={frame.ticket === "done" ? "ticket #7731" : undefined} state={frame.ticket} />
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[0.8rem] font-bold tracking-tighter">
          <span>{frame.round === 2 ? "Waiting again" : "Waiting for a reviewer"}</span>
          <span className="font-mono">{frame.hours} h / 48 h</span>
        </div>
        <div className="h-3 w-full bg-fg/10">
          <div className="h-3 bg-accent transition-[width] duration-700" style={{ width: `${(frame.hours / 48) * 100}%` }} />
        </div>
      </div>
      <div
        className={["flex items-baseline gap-2 bg-fg px-3 py-2 text-bg transition-all duration-500", frame.escalated ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"].join(" ")}
      >
        <span className="shrink-0 font-mono text-[0.8rem] font-bold">#compliance</span>
        <span className="truncate text-[0.9rem]">@lead A-2291 has waited 48 h</span>
      </div>
      <div className="flex gap-2">
        <div
          className={["flex-1 border-border px-3 py-2 text-center font-bold tracking-tighter transition-colors duration-300", frame.approved ? "bg-accent text-accent-fg" : "bg-bg"].join(" ")}
          style={BORDER}
        >
          Approve
        </div>
        <div className="flex-1 border-border bg-bg px-3 py-2 text-center font-bold tracking-tighter opacity-40" style={BORDER}>
          Reject
        </div>
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="cases.py · KycReview" highlightLines={frame.lines} />
      <ReviewQueue frame={frame} />
    </div>
  );
}

export function CaseReviewSlide() {
  return (
    <Slide title="A workflow can wait two days for a person" kicker="Case study · human in the loop" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">17 A workflow can wait two days for a person / 23:45–24:30 / 0:45</p>
        <p className="italic">Quick pass, about 45 seconds: the usual version in one sentence, point at the highlighted line, one honest cost.</p>
        <p>Fourth: a human in the loop. Identity verification. The vendor can't verify someone, so an analyst has to review them within 48 hours, or it escalates.</p>
        <p>The usual version is a status enum with nine values, a review queue in the admin panel, and a reminder bot that doesn't know what's in the database.</p>
        <p>Here: open a ticket, then wait_condition with a 48-hour timeout. While it waits, no process holds anything. It's a timer row in the database.</p>
        <p>On timeout we escalate and go back to waiting.</p>
        <p>The admin UI sends an update. Unlike a signal, an update returns a value, so the Approve button knows it worked. The handler sets decision, wait_condition wakes up, and run returns.</p>
        <p>Honest cost: add an update validator so a second decision is rejected. History stores inputs in plain text unless you add an encryption codec, so pass internal IDs, never passport numbers.</p>
      </SpeakerNote>
    </Slide>
  );
}
