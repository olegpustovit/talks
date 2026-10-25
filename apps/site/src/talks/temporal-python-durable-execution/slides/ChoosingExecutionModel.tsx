import { Arrow, Caption, DiagramNode, Slide, SpeakerNote, Tag, useLoopFrames } from "@talks/slide-engine";

const ROWS: { when: string; model: string; accent?: boolean }[] = [
  { when: "Independent periodic work, recovery is easy to explain", model: "Cron" },
  { when: "Standalone tasks, modest orchestration around them", model: "Queue" },
  { when: "Stateful sequence, long waits, events, compensation", model: "Temporal", accent: true },
  { when: "High-volume independent events, many consumers", model: "Kafka" },
];

function Chooser() {
  const { step } = useLoopFrames(ROWS, { stepMs: 3500, holdMs: 4500 });
  return (
    <div className="flex w-full flex-col gap-3">
      {ROWS.map((row, i) => (
        <div key={row.model} className={["flex items-stretch gap-3", i === step ? "" : "opacity-35"].join(" ")}>
          <DiagramNode className="flex-[2]">
            <p className="m-0">{row.when}</p>
          </DiagramNode>
          <Arrow />
          <div className="flex min-w-[12ch] flex-1 items-center">
            <Tag accent={row.accent}>{row.model}</Tag>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChoosingExecutionModelSlide() {
  return (
    <Slide title="Choosing the right execution model" kicker="A design heuristic" layout="wide">
      <Chooser />
      <Caption>→ A heuristic, not a ranking. How much recovery machinery would you otherwise build?</Caption>
      <SpeakerNote>
        <p className="font-bold">26 Choosing the right execution model / 38:00–39:15 / 1:15</p>
        <p className="italic">This comparison is a design heuristic, not a benchmark.</p>
        <p>So where would I use this? The rows highlight one at a time on a loop; no need to press Next.</p>
        <p>
          Cron: I would keep a simple scheduled job when the work is independent and recovery is
          easy to explain. A nightly cleanup can be perfectly fine as a scheduled query.
        </p>
        <p className="italic">→ Queue.</p>
        <p>A queue is often enough when each task stands on its own and the surrounding coordination is modest.</p>
        <p className="italic">→ Temporal.</p>
        <p>I would consider Temporal when a process has meaningful state across steps, waits for a long time, reacts to external events, or needs an explicit recovery and compensation path.</p>
        <p className="italic">→ Kafka.</p>
        <p>
          For a high-volume analytics stream, an event platform such as Kafka may fit the
          processing model better. The choice depends on the semantics of the work and what the
          team already operates. Temporal does not need to carry every event just because some
          business processes use it.
        </p>
        <p>Also, fire-and-forget has to match the importance of the data. If a business action depends on delivery, we need a durable path, even when the sender does not wait for the final consumer.</p>
        <p>This is a design judgment, not a universal ranking. Ask how much recovery machinery you would otherwise build and maintain, and whether the workflow model makes that behavior easier for your team to understand.</p>
      </SpeakerNote>
    </Slide>
  );
}
