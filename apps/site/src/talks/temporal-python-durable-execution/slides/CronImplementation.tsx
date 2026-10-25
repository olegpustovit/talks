import { Slide, SpeakerNote, useFrames } from "@talks/slide-engine";
import { UglyFile } from "../UglyFile";
import { CELERY, CRONTAB, SCHEMA, SQS, SWEEPER } from "../stackSnippets";

const FRAMES = [
  { show: ["schema"], note: "A users table. Signup time, and a few timestamps for later." },
  { show: ["schema", "celery"], note: "Most teams: Celery. A task sends the email, then writes sent_at." },
  { show: ["schema", "celery", "sqs"], note: "Some teams go further: SQS in front of the worker." },
  { show: ["schema", "celery", "sqs", "cron"], note: "A clock, because something has to notice that day 2 arrived." },
  {
    show: ["schema", "celery", "sqs", "cron", "sweeper"],
    note: "The sweeper is the product rule, in SQL. This already isn't four English sentences.",
  },
];

const FILES: { id: string; name: string; code: string }[] = [
  { id: "schema", name: "users.sql", code: SCHEMA },
  { id: "celery", name: "celery_app.py", code: CELERY },
  { id: "sqs", name: "sqs_worker.py", code: SQS },
  { id: "cron", name: "crontab", code: CRONTAB },
  { id: "sweeper", name: "trial_sweeper.sql", code: SWEEPER },
];

function NaiveStack() {
  const { frame } = useFrames(FRAMES);
  const visible = FILES.filter((f) => frame.show.includes(f.id));
  const cols = visible.length === 1 ? "grid-cols-1" : visible.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3";
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="m-0 font-bold tracking-tighter">{frame.note}</p>
      <div className={["grid gap-2", cols].join(" ")}>
        {visible.map((f) => (
          <UglyFile key={f.id} name={f.name} code={f.code} hot={f.id === frame.show[frame.show.length - 1]} />
        ))}
      </div>
    </div>
  );
}

export function CronImplementationSlide() {
  return (
    <Slide title="A table, a worker, a clock" layout="wide">
      <NaiveStack />
      <SpeakerNote>
        <p className="font-bold">03 A table, a worker, a clock / 02:45–04:00 / 1:15</p>
        <p className="italic">→ adds: Postgres, Celery, SQS, crontab, the sweeper query. Do not call it a solution.</p>
        <p>
          Okay. Here's what typical developers actually reach for. A relational database — we save
          the signup time, and we'll need somewhere to remember whether the reminder went out.
        </p>
        <p>
          Then a worker. Most Python shops: Celery. A task sends the email and updates the row.
          Some teams go further and put SQS in front, so the worker is just another consumer.
        </p>
        <p>
          And a clock. Cron, Celery beat, EventBridge, whatever you already operate. Something has
          to notice that two days have passed.
        </p>
        <p>
          That clock doesn't send the email. It runs a sweeper: a SQL query for users whose signup
          is old enough and whose reminder timestamp is still empty. That query is the product
          rule. Look at it. We're already translating four English sentences into a crontab, three
          sweepers, and a table that holds both the customer and the progress.
        </p>
        <p>This version can work. I'm not going to pretend it's exotic. Watch what we add next.</p>
      </SpeakerNote>
    </Slide>
  );
}
