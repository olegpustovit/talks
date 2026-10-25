import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, Tag, useFrames } from "@talks/slide-engine";
import { CHECKED_CODE, TRIAL_CODE, TRIAL_V2_CODE } from "../runtimeSnippets";

// Temporal's answer. A fragment of the run method, not locally tested.
const PATCHED_CODE = `        await workflow.sleep(2 * DAY)
        await workflow.execute_activity(
            send_reminder, user_id, start_to_close_timeout=MINUTE)
        if workflow.patched("day-7-nudge"):
            await workflow.sleep(5 * DAY)
            await workflow.execute_activity(
                send_nudge, user_id, start_to_close_timeout=MINUTE)
            await workflow.sleep(3 * DAY)
        else:
            await workflow.sleep(8 * DAY)
        await workflow.execute_activity(
            send_tips, user_id, start_to_close_timeout=MINUTE)`;

const CODES = {
  old: { code: TRIAL_CODE, filename: "trial.py · what Ada started on" },
  new: { code: TRIAL_V2_CODE, filename: "trial.py · deployed on day 11" },
  checked: { code: CHECKED_CODE, filename: "toy_runtime.py · CheckedWorkflow" },
  patched: { code: PATCHED_CODE, filename: "trial.py · on Temporal" },
};

const linesOf = (code: string, from: string, count = 1) => {
  const start = code.split("\n").findIndex((line) => line.includes(from)) + 1;
  return Array.from({ length: count }, (_, i) => start + i);
};
/** The `execute_activity(` line and the argument line under it. */
const callLines = (code: string, name: string) => linesOf(code, `${name},`).flatMap((n) => [n - 1, n]);

type RowState = "saved" | "match" | "stale" | "wrong" | "new" | "error";

// Ada's history from trial.py on day 11 (0–4), plus what the new code appends (5–7).
const ROWS = [
  { name: "sleep 2 days", detail: "deadline day 2" },
  { name: "send_reminder", detail: '{"sent": true}' },
  { name: "sleep 8 days", detail: "deadline day 10" },
  { name: "send_tips", detail: '{"sent": true}' },
  { name: "sleep 4 days", detail: "deadline day 14" },
  { name: "send_tips", detail: "sent again · day 14" },
  { name: "sleep 4 days", detail: "deadline day 18" },
  { name: "expire_if_unpaid", detail: "day 18" },
];

type Frame = {
  code: keyof typeof CODES;
  lines: number[];
  rows: number;
  states: Partial<Record<number, RowState>>;
  cursor?: number;
  day: number;
  tips: number;
  nudge: number;
  status: string;
};

const MATCHED = { 0: "match", 1: "match" } as const;

const FRAMES: Frame[] = [
  { code: "old", lines: [], rows: 5, states: {}, day: 11, tips: 1, nudge: 0, status: "Ada is on day 11. Her history is on disk. Her worker is waiting for day 14." },
  { code: "new", lines: linesOf(TRIAL_V2_CODE, "sleep(5 * DAY)", 4), rows: 5, states: {}, day: 11, tips: 1, nudge: 0, status: "Product wants a nudge on day 7. We deploy. Every running trial replays on the new code." },
  { code: "new", lines: linesOf(TRIAL_V2_CODE, "sleep(2 * DAY)", 3), rows: 5, states: MATCHED, cursor: 1, day: 11, tips: 1, nudge: 0, status: "Replay from the top. Positions 0 and 1 still line up." },
  { code: "new", lines: linesOf(TRIAL_V2_CODE, "sleep(5 * DAY)"), rows: 5, states: { ...MATCHED, 2: "stale" }, cursor: 2, day: 11, tips: 1, nudge: 0, status: "sleep(5 days) reads position 2: the old day-10 deadline. Already passed." },
  { code: "new", lines: callLines(TRIAL_V2_CODE, "send_nudge"), rows: 5, states: { ...MATCHED, 2: "stale", 3: "wrong" }, cursor: 3, day: 11, tips: 1, nudge: 0, status: "send_nudge reads position 3. That's send_tips's result. The toy hands it over. No nudge, ever." },
  { code: "new", lines: [...linesOf(TRIAL_V2_CODE, "sleep(3 * DAY)"), ...callLines(TRIAL_V2_CODE, "send_tips")], rows: 6, states: { ...MATCHED, 2: "stale", 3: "wrong", 4: "stale", 5: "new" }, cursor: 5, day: 14, tips: 2, nudge: 0, status: "sleep(3 days) waits for the old day-14 deadline. send_tips finds nothing saved, so Ada gets tips twice." },
  { code: "new", lines: [...linesOf(TRIAL_V2_CODE, "sleep(4 * DAY)"), ...callLines(TRIAL_V2_CODE, "expire_if_unpaid")], rows: 8, states: { ...MATCHED, 2: "stale", 3: "wrong", 4: "stale", 5: "new", 6: "new", 7: "new" }, cursor: 7, day: 18, tips: 2, nudge: 0, status: "The trial ends on day 18, not 14. Nothing raised an error." },
  { code: "checked", lines: linesOf(CHECKED_CODE, "if event.get", 3), rows: 5, states: { ...MATCHED, 2: "match", 3: "error" }, cursor: 3, day: 11, tips: 1, nudge: 0, status: "Check the name before replaying. The worker stops at position 3, before any email." },
  { code: "patched", lines: linesOf(PATCHED_CODE, "workflow.patched", 7), rows: 5, states: {}, day: 11, tips: 1, nudge: 0, status: "Temporal checks every replayed command. You branch old histories with workflow.patched, and replay production histories in CI." },
];

const TAG: Record<RowState, string> = {
  saved: "saved",
  match: "matches",
  stale: "old deadline",
  wrong: "wrong result",
  new: "new",
  error: "NondeterminismError",
};

function History({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="history.jsonl · ada" meta={`day ${frame.day}`} status={frame.status}>
      <div className="flex gap-2">
        <Stat label="send_nudge" value={`×${frame.nudge}`} />
        <Stat label="send_tips" value={`×${frame.tips}`} accent={frame.tips > 1} />
      </div>
      <div className="flex flex-col gap-1">
        {ROWS.slice(0, frame.rows).map((row, i) => {
          const state = frame.states[i] ?? "saved";
          const bad = state === "wrong" || state === "error" || state === "new";
          return (
            <div
              key={i}
              className={[
                "flex items-center gap-2 px-2 py-1 font-mono text-[0.8rem] transition-colors duration-300",
                i === frame.cursor ? "bg-accent/15" : "",
              ].join(" ")}
            >
              <span className="w-4 shrink-0 text-accent">{i === frame.cursor ? "▶" : ""}</span>
              <span className="w-4 shrink-0 text-muted">{i}</span>
              <span className="min-w-0 flex-1 truncate font-bold">{row.name}</span>
              <span className="hidden truncate text-muted xl:inline">{row.detail}</span>
              {state !== "saved" && <Tag accent={bad}>{TAG[state]}</Tag>}
            </div>
          );
        })}
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useFrames(FRAMES);
  const { code, filename } = CODES[frame.code];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <CodeEditor code={code} language="python" editable={false} size="sm" filename={filename} highlightLines={frame.lines} />
      <History frame={frame} />
    </div>
  );
}

export function ChangeTheCodeSlide() {
  return (
    <Slide title="New code replays an old history" kicker="The real cost" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">21 New code replays an old history / 28:30–31:30 / 3:00</p>
        <p className="italic">Arrow keys. Nine beats. This is the toy runtime from slide 11, and examples/test_change_code.py checks every number on the panel.</p>
        <p>Rule one said replay expects the same decisions. Here's what that means the first time you deploy. Ada is on day eleven. Reminder on day two, tips on day ten, and her history is sitting on disk.</p>
        <p className="italic">→ New code.</p>
        <p>Product wants a nudge on day seven. Easy: sleep five, nudge, sleep three. We deploy. Every trial that's already running now replays on this code.</p>
        <p className="italic">→ Replay.</p>
        <p>Positions zero and one still match. Position two is a sleep, and the toy reads the old day-ten deadline. Already passed. Fine so far.</p>
        <p className="italic">→ send_nudge.</p>
        <p>Position three. The code asks for send_nudge. History has send_tips. Our toy only checks the cursor, so it hands send_tips's result to send_nudge. The nudge is never sent.</p>
        <p className="italic">→ → Tips again, day 18.</p>
        <p>The next sleep reads the old day-fourteen deadline. Then send_tips finds nothing saved at its new position, so it runs. Ada gets tips twice. The expiry sleep starts on day fourteen, so her trial ends on day eighteen. No exception anywhere.</p>
        <p className="italic">→ The check.</p>
        <p>Four lines fix the silent part: before replaying, check that the saved event is the call the code is making. Now the worker stops at position three, before any email. Loud beats wrong.</p>
        <p className="italic">→ Temporal.</p>
        <p>Temporal does this check on every command. A mismatch fails the workflow task, and the workflow stays put until you ship code that matches. Then you choose: workflow.patched, where old histories take the old branch and new trials take the new one, or a new workflow type for new signups. And the Replayer runs histories exported from production against your branch in CI, so you find this before the deploy.</p>
        <p>Honest cost: every running workflow is a promise about your old code. Patches pile up until the last old trial finishes.</p>
        <p>Transition: owning replay costs you this. Owning time buys you something back.</p>
      </SpeakerNote>
    </Slide>
  );
}
