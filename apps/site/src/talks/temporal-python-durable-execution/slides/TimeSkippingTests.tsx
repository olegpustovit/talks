import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, StepRow, useLoopFrames, type StepState } from "@talks/slide-engine";
import { at, testSnippet } from "../caseCode";

const CODE = `${testSnippet("fake")}\n\n${testSnippet("test")}`;
const MEASURED = "0.32 s";

const STEPS = [
  { label: "send_reminder", day: 2 },
  { label: "send_tips", day: 10 },
  { label: "expire_if_unpaid", day: 14 },
];

type Frame = { lines: number[]; day: number; steps: StepState[]; passed: boolean; status: string; ms?: number };

const RUN = at(CODE, "execute_workflow", 3);

const FRAMES: Frame[] = [
  { lines: at(CODE, "start_time_skipping", 4), day: 0, steps: ["idle", "idle", "idle"], passed: false, status: "Start Temporal's test server and a worker with fake activities." },
  { lines: [...RUN, ...at(CODE, '@activity.defn(name="send_reminder")', 4)], day: 2, steps: ["done", "idle", "idle"], passed: false, status: "The workflow is only waiting on a timer, so the server skips to day 2." },
  { lines: RUN, day: 10, steps: ["done", "done", "idle"], passed: false, status: "Skip to day 10." },
  { lines: RUN, day: 14, steps: ["done", "done", "done"], passed: false, status: "Skip to day 14." },
  { lines: [...at(CODE, "elapsed = await"), ...at(CODE, "assert elapsed", 2)], day: 14, steps: ["done", "done", "done"], passed: true, status: `14 days on the workflow clock. ${MEASURED} on yours.`, ms: 3000 },
];

const MARKS = new Set([0, 2, 10, 14]);

function TestRun({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="$ pytest test_cases.py" meta="time-skipping server" status={frame.status}>
      <div className="flex gap-2">
        <Stat label="Workflow clock" value={`day ${frame.day}`} accent={frame.day > 0 && !frame.passed} />
        <Stat label="Wall clock" value={frame.passed ? MEASURED : "…"} accent={frame.passed} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-15 gap-1">
          {Array.from({ length: 15 }, (_, day) => (
            <div key={day} className={["h-5 transition-colors duration-500", day <= frame.day ? (MARKS.has(day) ? "bg-accent" : "bg-fg") : "bg-fg/10"].join(" ")} />
          ))}
        </div>
        <div className="grid grid-cols-15 gap-1">
          {Array.from({ length: 15 }, (_, day) => (
            <span key={day} className="text-center font-mono text-[0.7rem] font-bold text-muted">{MARKS.has(day) ? day : ""}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {STEPS.map((step, i) => (
          <StepRow key={step.label} label={step.label} detail={`day ${step.day}`} state={frame.steps[i]!} />
        ))}
      </div>
      <div className={["px-3 py-2 font-mono text-[0.85rem] transition-colors duration-300", frame.passed ? "bg-accent font-bold text-accent-fg" : "bg-fg text-bg"].join(" ")}>
        {frame.passed ? `1 passed in ${MEASURED.replace(" ", "")}` : "test_trial_lasts_14_days …"}
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES, { stepMs: 1500 });
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="test_cases.py" highlightLines={frame.lines} />
      <TestRun frame={frame} />
    </div>
  );
}

export function TimeSkippingTestsSlide() {
  return (
    <Slide title="A 14-day trial test runs in a third of a second" kicker="The upside of a custom runtime" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">22 A 14-day trial test runs in a third of a second / 31:30–32:45 / 1:15</p>
        <p>Here's the upside of that custom runtime. The SDK owns time, so a test can own it too.</p>
        <p>start_time_skipping starts Temporal's test server. The worker gets fake activities registered under the real names.</p>
        <p>execute_workflow runs the real Trial class from slide 13. Whenever the workflow is only waiting on a timer, the server jumps the clock: day 2, day 10, day 14.</p>
        <p>The test asserts that 14 days passed on the workflow clock. On my laptop the whole pytest run takes 0.32 seconds, once the test server has been downloaded.</p>
        <p>Same code, same timers. No test-only branch, no environment variable that turns days into seconds.</p>
        <p>Honest cost: this is a test server, not your cluster. The first run downloads it, and integration tests still belong on a real service.</p>
      </SpeakerNote>
    </Slide>
  );
}
