import { Caption, CodeEditor, Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";
import { TRIAL_CODE } from "../runtimeSnippets";

const CODE = `from datetime import timedelta\nfrom temporalio import activity, workflow\n\n${TRIAL_CODE}`;
const LINES = CODE.split("\n");
const matching = (test: (line: string) => boolean) => LINES.flatMap((line, i) => (test(line) ? [i + 1] : []));
const withNext = (lines: number[]) => lines.flatMap((n) => [n, n + 1]);

type Block = { label: string; code: string; ok?: boolean };
type Rule = { tag: string; claim: string; blocks: Block[]; why: string; lines: number[] };

const RULES: Rule[] = [
  {
    tag: "Deterministic",
    claim: "Same history in, same decisions out.",
    blocks: [
      { ok: false, label: "breaks replay", code: "for user_id in set(user_ids):\n    await notify(user_id)" },
      { ok: true, label: "instead", code: "for user_id in sorted(set(user_ids)):\n    await notify(user_id)" },
    ],
    why: "Replay runs this function again from the top. String hashes change per process, so set order can too. The sandbox won't catch this one.",
    lines: matching((line) => line.startsWith("        ")),
  },
  {
    tag: "Sandboxed",
    claim: "Not the standard library you know.",
    blocks: [
      { ok: false, label: "RestrictedWorkflowAccessError", code: "time.sleep(60)\nstarted = datetime.now()\ncoupon = uuid.uuid4()" },
      { ok: true, label: "instead", code: "await workflow.sleep(60)\nstarted = workflow.now()\ncoupon = workflow.uuid4()" },
    ],
    why: "The workflow file runs in a sandbox. Calls that could differ on replay are rejected when they run.",
    lines: matching((line) => line.startsWith("from ")),
  },
  {
    tag: "Its own event loop",
    claim: "asyncio here is not asyncio.",
    blocks: [
      { ok: true, label: "becomes a durable server timer", code: "await asyncio.sleep(2 * 24 * 3600)" },
      { ok: false, label: "not supported", code: "await asyncio.to_thread(render_pdf)\nloop.run_in_executor(pool, render_pdf)" },
    ],
    why: "The SDK implements the event loop your workflow runs on. Timers become server timers. There are no threads to hand work to.",
    lines: matching((line) => line.includes("workflow.sleep(")),
  },
  {
    tag: "await parks",
    claim: "await doesn't wait. It suspends.",
    blocks: [
      { label: "what you wrote", code: "await workflow.execute_activity(\n    send_reminder, user_id, start_to_close_timeout=MINUTE)" },
      { label: "what the runtime does", code: "1. emit a schedule-activity command\n2. suspend this coroutine\n3. hand the workflow task back\n4. resume once the result is in history" },
    ],
    why: "The activity runs later, maybe on another worker. Meanwhile this coroutine can be evicted from memory and rebuilt by replay.",
    lines: withNext(matching((line) => line.includes("execute_activity("))),
  },
  {
    tag: "Small payloads",
    claim: "Every input and result lands in history.",
    blocks: [
      { ok: false, label: "fails over 2 MB", code: "@activity.defn\nasync def render_invoice(order_id: str) -> bytes:\n    return pdf_bytes" },
      { ok: true, label: "instead: return a reference", code: "@activity.defn\nasync def render_invoice(order_id: str) -> str:\n    return upload(pdf_bytes)" },
    ],
    why: "An activity result is written into the event history before the workflow sees it. Keep the bytes elsewhere; pass the key.",
    lines: withNext(matching((line) => line.includes("execute_activity("))),
  },
  {
    tag: "Short histories",
    claim: "A loop can't live in one history forever.",
    blocks: [
      { ok: false, label: "terminated at 50 MB or 51,200 events", code: "while True:\n    await workflow.sleep(MINUTE)\n    await check_inbox(user_id)" },
      {
        ok: true,
        label: "instead: continue as new",
        code: "info = workflow.info()\nwhile True:\n    await workflow.sleep(MINUTE)\n    await check_inbox(user_id)\n    if info.is_continue_as_new_suggested():\n        workflow.continue_as_new(user_id)",
      },
    ],
    why: "Every wait and every call adds events. Continue-As-New ends this run and starts a fresh history under the same workflow ID.",
    lines: matching((line) => line.trimStart().startsWith("await ")),
  },
];

const FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];
const SUMMARY = RULES.length + 1;

function WorkflowCode({ lines }: { lines: number[] }) {
  return (
    <div className="min-w-0 border-border bg-surface" style={{ borderWidth: "var(--se-border-width)" }}>
      <p className="m-0 border-border px-3 py-1.5 font-mono text-[0.8rem] font-bold text-muted" style={{ borderBottomWidth: "var(--se-border-width)" }}>
        trial.py · from slide 13
      </p>
      <pre className="m-0 overflow-x-auto py-2 font-mono text-[clamp(0.7rem,1.4cqh,0.85rem)] leading-[1.5]" data-testid="subset-code">
        {LINES.map((line, i) => {
          const on = lines.includes(i + 1);
          const dim = lines.length > 0 && !on;
          return (
            <span
              key={i}
              className={`block border-l-4 pr-3 transition-colors duration-300 ${on ? "border-accent bg-accent/15" : "border-transparent"} ${dim ? "opacity-70" : ""}`}
            >
              <span className="mr-3 inline-block w-6 text-right text-muted">{i + 1}</span>
              {line || " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

function BlockLabel({ block }: { block: Block }) {
  if (block.ok === true) return <Tag accent>✓ {block.label}</Tag>;
  if (block.ok === false) return <Tag>✗ {block.label}</Tag>;
  return <Tag className="opacity-60">{block.label}</Tag>;
}

function RuleCard({ rule, index }: { rule: Rule; index: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="m-0 text-[clamp(1.2rem,2.1cqw,1.6rem)] leading-tight font-bold tracking-tighter">
        <span className="text-accent">{index + 1}.</span> {rule.claim}
      </p>
      {rule.blocks.map((block) => (
        <div key={block.label} className="flex flex-col gap-1">
          <BlockLabel block={block} />
          <CodeEditor code={block.code} language={block.ok === undefined ? "text" : "python"} editable={false} wrapLines />
        </div>
      ))}
      <p className="m-0 text-[clamp(0.95rem,1.5cqw,1.1rem)] leading-snug text-muted">{rule.why}</p>
    </div>
  );
}

function Summary() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {RULES.map((rule, i) => (
          <li key={rule.tag} className="m-0 text-[clamp(1.05rem,1.9cqw,1.35rem)] leading-snug font-bold tracking-tighter">
            <span className="text-accent">{i + 1}.</span> {rule.claim}
          </li>
        ))}
      </ol>
      <Caption>Python syntax on a replay runtime. The complexity moved into rules you have to know.</Caption>
    </div>
  );
}

function Catch() {
  const { step } = useFrames(FRAMES);

  if (step === 0) {
    return (
      <div className="flex flex-col gap-6" data-testid="catch-question">
        <p className="m-0 max-w-[14ch] text-[clamp(3rem,9cqw,7.5rem)] leading-[0.86] font-bold tracking-tighter">So what's the catch?</p>
        <p className="m-0 text-[clamp(1.05rem,2cqw,1.4rem)] text-muted">Where does the complexity go when this runs in production?</p>
      </div>
    );
  }

  const summary = step === SUMMARY;
  const ruleIndex = step - 1;
  const rule = RULES[ruleIndex];

  return (
    <div className="flex flex-col gap-4">
      <p aria-hidden className="m-0 text-[clamp(1.7rem,4cqw,3.1rem)] leading-[0.95] font-bold tracking-tighter">
        Workflow code only looks like Python
      </p>
      <div className="flex flex-wrap gap-2">
        {RULES.map((r, i) => (
          <Tag key={r.tag} accent={i === ruleIndex} className={summary || i <= ruleIndex ? "" : "opacity-30"}>
            {r.tag}
          </Tag>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <WorkflowCode lines={summary || !rule ? [] : rule.lines} />
        {summary || !rule ? <Summary /> : <RuleCard rule={rule} index={ruleIndex} />}
      </div>
    </div>
  );
}

export function WorkflowSubsetSlide() {
  return (
    <Slide title="Workflow code only looks like Python" hideTitle layout="wide">
      <Catch />
      <SpeakerNote>
        <p className="font-bold">20 Workflow code only looks like Python / 26:00–28:30 / 2:30</p>
        <p className="italic">The question is alone on screen. Ask it and wait a beat. Then about twenty seconds per rule.</p>
        <p>So what's the catch? That looked too easy. Where does the complexity go when we run this in production?</p>
        <p>Here's the answer: workflow code only looks like Python. It's a subset of Python, running on a replay runtime, with rules you can't see by reading it. Six of them. Watch the highlighted lines in the code we just wrote.</p>
        <p>One, deterministic. Replay runs this function again from the top and expects the same decisions. Not just "no random". Even iterating a set of strings can change order between processes, because string hashes are randomized. The sandbox won't catch that one.</p>
        <p>Two, sandboxed. time.sleep, datetime.now, uuid4: rejected when they run, with RestrictedWorkflowAccessError. Look at the imports: this file is loaded into a sandbox. Use workflow.sleep, workflow.now, workflow.uuid4.</p>
        <p>Three, its own event loop. asyncio.sleep still works, but it isn't a sleep. The SDK implements the event loop and turns it into a durable server timer. to_thread and executors aren't there.</p>
        <p>Four, await parks. When we await an activity, nothing sits and waits. The runtime emits a schedule-activity command, suspends the coroutine, and hands the task back. The coroutine can even be evicted from memory and rebuilt by replay when the result arrives.</p>
        <p>Five, small payloads. Every activity input and result is written into history. A payload errors at 2 MB. Return a key, not the PDF.</p>
        <p>Six, short histories. Every wait and every call is events. At 50 MB or 51,200 events, the execution is terminated. A loop checks is_continue_as_new_suggested and continues as new, carrying its state.</p>
        <p>So the complexity didn't disappear. It moved into rules you have to know, and into a service and workers you have to run. And rule one has a consequence the first time you deploy.</p>
      </SpeakerNote>
    </Slide>
  );
}
