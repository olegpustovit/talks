import { Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";

const ROWS = [
  {
    when: "1990s",
    what: "Workflow as a field",
    detail: "van der Aalst, Petri nets, WfMC. IBM FlowMark. The problem is old. The usual answer was a diagram in an engine.",
  },
  {
    when: "2012",
    what: "Amazon SWF",
    detail: "Maxim Fateev, Samar Abbas. Write the process in code. The service tracks state so you don't.",
  },
  {
    when: "Azure",
    what: "Durable Task",
    detail: "Samar at Microsoft. Same question, different cloud. Later, Durable Functions.",
  },
  {
    when: "2015",
    what: "Cadence",
    detail: "Both in Seattle, at Uber. Home-grown recovery was expensive. Express the process; the platform remembers.",
  },
  {
    when: "2019",
    what: "Temporal",
    detail: "They leave Uber. Temporal is a fork of Cadence — the only code fork on this slide.",
  },
];

function Origin() {
  const { step } = useFrames(ROWS);
  return (
    <div className="flex flex-col gap-4">
      {ROWS.map((row, i) => {
        const on = i <= step;
        const now = i === step;
        return (
          <div
            key={row.when}
            className={["grid grid-cols-[7ch_1fr] items-baseline gap-x-5 gap-y-1", on ? "" : "opacity-25"].join(" ")}
          >
            <p className={["m-0 font-bold tracking-tighter", now ? "text-accent" : "text-muted"].join(" ")}>
              {row.when}
            </p>
            <div>
              <p className="m-0 font-bold tracking-tighter">
                {now ? <Tag accent>{row.what}</Tag> : row.what}
              </p>
              {on && <p className="mt-1 mb-0 text-[0.95rem] leading-snug text-muted">{row.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LineageSlide() {
  return (
    <Slide title="Where it came from" layout="wide">
      <Origin />
      <SpeakerNote>
        <p className="font-bold">08 Where it came from / 10:00–11:00 / 1:00</p>
        <p className="italic">
          Start before Amazon. Then SWF, Azure, Cadence, Temporal. Only Cadence → Temporal is a
          code fork. This is not a product tour.
        </p>
        <p>
          This problem is older than two Amazon engineers. In the 1990s it already had a name:
          workflow. van der Aalst's Petri-net papers. The Workflow Management Coalition. Systems
          like IBM FlowMark. The usual answer was a process diagram inside an engine — not a
          function you sleep in.
        </p>
        <p>
          The turn for our story is 2012. Amazon ships Simple Workflow Service. Maxim Fateev led
          that team; he had already worked on the messaging that became SQS. Samar Abbas helped
          ship the public version. The bet: write the process in ordinary code. The service keeps
          the execution state, so your application doesn't have to.
        </p>
        <p>
          Their paths split. Maxim stays in the AWS lineage — Flow Framework. Samar goes to Azure
          and helps build the Durable Task Framework, later part of Durable Functions. Same
          question. Not the same git repo.
        </p>
        <p>
          2015, both in Seattle, at Uber. They build Cadence. Uber's scale made the cost of
          home-grown recovery obvious — the wall we just looked at, times a thousand services.
        </p>
        <p>
          2019 they leave and found Temporal. It originates as a fork of Cadence. That is the only
          code fork on this slide. The rest is people and the same programming problem: can the
          runtime own enough recovery that the application still reads like the process we meant
          to build?
        </p>
      </SpeakerNote>
    </Slide>
  );
}
