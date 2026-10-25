import { Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";

const WHAT = [
  "The work keeps its place when the process dies.",
  "Remember enough to continue. The worker is replaceable. The trial is not.",
];

const WHY = [
  "Every team was rebuilding the wall: flags, sweepers, checkers.",
  "The product was four sentences. Recovery had become the product.",
  "At Uber, that tax was a thousand services. They wanted the function back.",
];

const FRAMES = [
  { what: 0, why: 0 },
  { what: 1, why: 0 },
  { what: 2, why: 0 },
  { what: 2, why: 2 },
  { what: 2, why: 3 },
];

function NamedIdea() {
  const { frame } = useFrames(FRAMES);
  const what = WHAT.slice(0, frame.what);
  const why = WHY.slice(0, frame.why);
  if (what.length === 0) return null;
  return (
    <div
      className={
        why.length > 0
          ? "grid items-start gap-10 lg:grid-cols-2"
          : "flex flex-col gap-4"
      }
    >
      <div className="flex flex-col gap-4">
        {why.length > 0 && <Tag>What it is</Tag>}
        {what.map((line) => (
          <p
            key={line}
            className="m-0 max-w-[22ch] text-[clamp(1.35rem,2.6cqw,2rem)] font-bold leading-[1.05] tracking-tighter"
          >
            {line}
          </p>
        ))}
      </div>
      {why.length > 0 && (
        <div className="flex flex-col gap-4">
          <Tag>Why it exists</Tag>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {why.map((line) => (
              <li
                key={line}
                className="m-0 max-w-[28ch] text-[clamp(1.2rem,2.3cqw,1.7rem)] font-bold leading-[1.08] tracking-tighter"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DurableExecutionSlide() {
  return (
    <Slide title="Durable execution" layout="title">
      <NamedIdea />
      <SpeakerNote>
        <p className="font-bold">07 Durable execution / 08:00–10:00 / 2:00</p>
        <p className="italic">
          First frame: only the two words. Then what it is. Then why it exists. History is the
          next slide.
        </p>
        <p>Durable execution. The work keeps its place when the process dies.</p>
        <p>
          You remember enough to continue. The worker is replaceable — a deploy, an OOM, a new
          box. The trial is not. Ada is still on day two. The reminder already went out.
        </p>
        <p>
          That is not magic immortality. Things still stop. It is a refusal to treat a stopped
          process as the loss of the business process.
        </p>
        <p className="italic">→ Why it exists: two lines appear.</p>
        <p>
          The people who built this didn't start from a paper. They started from the wall we just
          looked at. Every team at Amazon, then Uber, was writing the same flags, sweepers,
          checkers. The business process was four sentences. Recovery had become the product.
        </p>
        <p className="italic">→ Third line: Uber.</p>
        <p>
          At Uber the tax was obvious — a thousand services, each with its own half-built workflow
          engine. A team would ask to replace one queue consumer and discover fifteen coupled
          steps.
        </p>
        <p>
          That is the motivation. They wanted the function back. Stop spending the application on
          "did we already send this." Put recovery in a runtime so the code can look like the
          function: sleep, send, sleep, decide.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
