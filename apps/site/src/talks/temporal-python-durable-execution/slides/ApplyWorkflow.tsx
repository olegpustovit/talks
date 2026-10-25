import {
  Caption,
  CodeEditor,
  ExecutionReplay,
  Slide,
  SpeakerNote,
  useFrames,
  type ReplayAction,
  type ReplayCommand,
} from "@talks/slide-engine";
import { IMPERATIVE_CODE, TRIAL_CODE } from "../runtimeSnippets";

const LINES = TRIAL_CODE.split("\n");
const lineOf = (text: string) => LINES.findIndex((line) => line.includes(text)) + 1;

const wait = (days: number): ReplayCommand => ({
  kind: "timer",
  name: `sleep ${days} days`,
  days,
  lines: [lineOf(`sleep(${days} * DAY)`)],
});
const call = (name: string, result: Record<string, unknown>): ReplayCommand => ({
  kind: "activity",
  name,
  arg: "user-42",
  result,
  lines: [lineOf(`${name},`) - 1, lineOf(`${name},`)],
});

const COMMANDS = [
  wait(2),
  call("send_reminder", { sent: true }),
  wait(8),
  call("send_tips", { sent: true }),
  wait(4),
  call("expire_if_unpaid", { expired: true }),
];

// Reminder is sent and saved, the worker dies waiting for day 10,
// the replacement replays the reminder from history, then sends tips.
const SCRIPT: ReplayAction[] = [
  "next", "next",
  "next", "next", "next",
  "next",
  "kill",
  "restart",
  "next", "next", "next", "next",
  "next", "next", "next",
];

// Same trial, worse timing: the reminder runs, and the worker dies before its
// result is saved. The replacement finds no event at that position and sends it again.
const CRASH_BEFORE_SAVE: ReplayAction[] = [
  "next", "next",
  "next",
  "kill",
  "restart",
  "next",
  "next", "next", "next",
  "next",
];

function Apply() {
  const { step } = useFrames([0, 1, 2, 3]);
  if (step === 2) return <ExecutionReplay key="saved" code={TRIAL_CODE} commands={COMMANDS} script={SCRIPT} filename="trial.py" />;
  if (step === 3) {
    return (
      <div className="flex flex-col gap-3">
        <ExecutionReplay key="unsaved" code={TRIAL_CODE} commands={COMMANDS} script={CRASH_BEFORE_SAVE} filename="trial.py" />
        <Caption>The crash between two writes didn't go away. It moved into the activity: send_reminder ×2.</Caption>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className={step === 1 ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]" : ""}>
        <CodeEditor code={IMPERATIVE_CODE} language="python" editable={false} filename="trial.py · infinite machine" />
        {step === 1 && <CodeEditor code={TRIAL_CODE} language="python" editable={false} filename="trial.py · our tiny API" />}
      </div>
      <Caption>
        {step === 0
          ? "The code from slide 10."
          : "Same lines, same order. Sleeps and calls now go through our runtime."}
      </Caption>
    </div>
  );
}

export function ApplyWorkflowSlide() {
  return (
    <Slide title="The same trial can survive a worker" kicker="Apply our tiny API" layout="wide">
      <Apply />
      <SpeakerNote>
        <p className="font-bold">12 The same trial can survive a worker / 16:00–19:30 / 3:30</p>
        <p>First, the infinite-machine code from slide 10 again.</p>
        <p className="italic">Press Next. The workflow appears next to it.</p>
        <p>Now the same function on our tiny API. Read them side by side: sleep, call, sleep, call, sleep, call. time.sleep became workflow.sleep. A direct call became execute_activity. The three business functions are the ones we already had; they sit above this snippet, marked with activity.defn. That's the point: the workflow still reads like the spec.</p>
        <p className="italic">Press Next. The crash animation plays by itself and loops. Narrate over it. It models these calls in the browser; no Python runs and no email is sent.</p>
        <p>Two days pass. The reminder runs, and its result is saved outside the worker. The worker starts waiting for day ten, and it gets killed. Memory is gone. History is not. A new worker starts at the top. The day-two wait has already passed. The reminder comes back from history, and the counter stays at one. It waits for day ten, then sends tips.</p>
        <p className="italic">Press Next. A second loop: same code, worse timing. Point at send_reminder ×2.</p>
        <p>Now kill it one step earlier. The reminder runs, and the worker dies before its result is saved. The new worker replays the day-two wait, reaches position one, finds nothing saved, and sends the reminder again. Counter: two.</p>
        <p>Remember slide four? The email went out, the worker died before the write. That crash didn't go away. It moved into the gap between an activity's effect and its saved result. Replay makes that gap small and names it; it doesn't close it. Every activity still owes you idempotency: a message ID, an idempotency key, a check before the charge.</p>
        <p>Transition: keep this workflow in mind. Where did these API names come from?</p>
      </SpeakerNote>
    </Slide>
  );
}
