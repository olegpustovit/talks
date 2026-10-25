import { CodeEditor, Slide, SpeakerNote, useFrames } from "@talks/slide-engine";

const RULES = [
  "When someone signs up, they get 14 days free.",
  "If they're still on the trial at day 2, send a reminder.",
  "If they're still on the trial at day 10, send a few tips.",
  "On day 14: if they paid, keep access. If not, end the trial.",
];

const WORDS = ["statements", "loops", "arrays", "functions", "sleep"];

const FRAMES = [
  { mode: "why" as const, rules: 0, code: "" },
  {
    mode: "write" as const,
    rules: 1,
    code: `def trial(user_id):
    # they just signed up`,
  },
  {
    mode: "write" as const,
    rules: 2,
    code: `def trial(user_id):
    time.sleep(days=2)
    send_reminder(user_id)`,
  },
  {
    mode: "write" as const,
    rules: 3,
    code: `def trial(user_id):
    time.sleep(days=2)
    send_reminder(user_id)
    time.sleep(days=8)
    send_tips(user_id)`,
  },
  {
    mode: "write" as const,
    rules: 4,
    code: `def trial(user_id):
    time.sleep(days=2)
    send_reminder(user_id)
    time.sleep(days=8)
    send_tips(user_id)
    time.sleep(days=4)
    expire_if_unpaid(user_id)`,
  },
];

function WhyWrite() {
  const { frame } = useFrames(FRAMES);
  if (frame.mode === "why") {
    return (
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {WORDS.map((w, i) => (
          <li
            key={w}
            className={[
              "m-0 font-bold tracking-tighter",
              i === WORDS.length - 1
                ? "text-[clamp(2rem,4.5cqw,3.4rem)] text-accent"
                : "text-[clamp(1.6rem,3.6cqw,2.7rem)]",
            ].join(" ")}
          >
            {w}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(16ch,0.9fr)_minmax(0,1.1fr)]">
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {RULES.slice(0, frame.rules).map((rule, i) => (
          <li key={rule} className="m-0 flex gap-3">
            <span
              className={
                i === frame.rules - 1
                  ? "font-bold tracking-tighter text-accent"
                  : "font-bold tracking-tighter text-muted"
              }
            >
              {i + 1}
            </span>
            <p className="m-0 font-bold leading-snug tracking-tighter">{rule}</p>
          </li>
        ))}
      </ol>
      <CodeEditor code={frame.code} language="python" editable={false} filename="trial.py" />
    </div>
  );
}

export function InfinitelyReliableComputerSlide() {
  return (
    <Slide title="Why so complicated?" layout="wide">
      <WhyWrite />
      <SpeakerNote>
        <p className="font-bold">05 Why so complicated? / 05:15–06:30 / 1:15</p>
        <p className="italic">
          First beat: programming is statements, loops, sleep. Then → write the spec as a function.
          time.sleep — not a workflow, not a framework.
        </p>
        <p>
          Look at that wall. Why does a fourteen-day trial need locks, sweepers, a checker against
          the email provider? When we learned to program, it was statements. Loops. Arrays.
          Functions. If we needed to wait, we slept.
        </p>
        <p>So for a second, let's write this the way it actually reads.</p>
        <p>
          Someone signs up — that's the function starting. Two days later, if they're still on the
          trial, send a reminder: sleep, then send. Day ten: sleep, then tips. Day fourteen: sleep,
          then keep access or end the trial.
        </p>
        <p>
          That's the product. Top to bottom. time.sleep. No timestamps, no crontab, no sweeper.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
