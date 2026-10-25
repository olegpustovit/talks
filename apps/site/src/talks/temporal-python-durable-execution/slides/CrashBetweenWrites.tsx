import { Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";
import { UglyFile } from "../UglyFile";
import {
  BEAT,
  CELERY,
  CHECKER,
  CRONTAB,
  EXPIRE,
  LOCK,
  RETRY,
  SCHEMA_AFTER,
  SQS,
  SWEEPER,
} from "../stackSnippets";

/** Intended path. Visible and grey from the first frame. Crash is not on it. */
const BEATS = [
  { at: "1", label: "Sweeper finds Ada" },
  { at: "2", label: "POST /send · 202" },
  { at: "3", label: "UPDATE sent_at" },
  { at: "4", label: "Done" },
];

const TWO_WRITES = `mail.send("day-2", to=user.email)
user.reminder_sent_at = now()
user.save()`;

const TWO_WRITES_CRASH = `mail.send("day-2", to=user.email)   # 202 accepted
# ✕ crash
user.reminder_sent_at = now()       # never runs
user.save()`;

const WALL = [
  { name: "users.sql", code: SCHEMA_AFTER, added: "attempts, lock, message id" },
  { name: "celery_app.py", code: CELERY },
  { name: "sqs_worker.py", code: SQS },
  { name: "crontab", code: CRONTAB },
  { name: "trial_sweeper.sql", code: SWEEPER },
  { name: "celerybeat.py", code: BEAT, added: "five clocks now" },
  { name: "expire_sweeper.sql", code: EXPIRE, added: "who didn't pay" },
  { name: "claim_row.sql", code: LOCK, added: "lock the row" },
  { name: "retry_unacked.py", code: RETRY, added: "retry the unacked" },
  { name: "reconcile_sendgrid.py", code: CHECKER, added: "ask the provider" },
];

const FRAMES = [
  { beat: -1, sent: "NULL", mail: 0, crash: false, extra: false },
  { beat: 0, sent: "NULL", mail: 0, crash: false, extra: false },
  { beat: 1, sent: "NULL", mail: 1, crash: false, extra: false },
  { beat: 1, sent: "NULL", mail: 1, crash: true, extra: false },
  { beat: 1, sent: "NULL", mail: 2, crash: true, extra: false },
  { beat: 1, sent: "NULL", mail: 2, crash: true, extra: true },
];

function EventStrip({ current, crashed }: { current: number; crashed: boolean }) {
  return (
    <div className="flex w-full items-start">
      {BEATS.map((b, i) => {
        const filledTo = crashed ? 1 : current;
        const on = i <= filledTo;
        const now = !crashed && i === current;
        const skipped = crashed && i >= 2;
        return (
          <div key={b.at} className="flex min-w-0 flex-1 items-start">
            <div className={["flex min-w-0 flex-1 flex-col gap-2 pr-2", skipped ? "opacity-35" : ""].join(" ")}>
              <div className="flex items-center">
                <div
                  className={[
                    "h-3.5 w-3.5 shrink-0",
                    now ? "bg-accent" : on ? "bg-fg" : "bg-fg/20",
                  ].join(" ")}
                />
                {i < BEATS.length - 1 && (
                  <div className={["h-[3px] min-w-0 flex-1", i < filledTo ? "bg-fg" : "bg-fg/20"].join(" ")} />
                )}
              </div>
              <Tag accent={now}>{b.at}</Tag>
              <p className="m-0 text-[0.95rem] font-bold leading-tight tracking-tighter">{b.label}</p>
            </div>
            {i === 1 && crashed && (
              <div className="flex shrink-0 flex-col items-center gap-2 px-1 pt-0">
                <div className="h-3.5 w-3.5 bg-accent" />
                <Tag accent>crash</Tag>
                <p className="m-0 text-[0.95rem] font-bold leading-tight tracking-tighter">Worker dies</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DbRow({ sentAt, hot, wide }: { sentAt: string; hot?: boolean; wide?: boolean }) {
  const cols = wide
    ? ["email", "signup_at", "reminder_sent_at", "attempts", "locked_at", "msg_id", "trial_status"]
    : ["email", "signup_at", "reminder_sent_at", "trial_status"];
  const vals = wide
    ? ["ada@forge.dev", "day 0", sentAt, "1", "NULL", "NULL", "trial"]
    : ["ada@forge.dev", "day 0", sentAt, "trial"];
  const cell = "border-border px-2 py-1.5 text-[0.8rem] font-bold tracking-tighter";
  const head = "border-border px-2 py-1 text-[0.65rem] font-bold tracking-tighter text-muted";
  return (
    <div className="overflow-hidden border-border bg-surface" style={{ borderWidth: "var(--se-border-width)" }}>
      <p
        className="m-0 border-border px-3 py-1.5 text-[0.7rem] font-bold tracking-tighter text-muted"
        style={{ borderBottomWidth: "var(--se-border-width)" }}
      >
        users · ada
      </p>
      <table className="w-full border-collapse font-mono">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className={`${head} text-left`} style={{ borderBottomWidth: "var(--se-border-width)" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {vals.map((v, i) => (
              <td
                key={cols[i]}
                className={cell}
                style={
                  cols[i] === "reminder_sent_at" && hot
                    ? {
                        color: "var(--color-accent)",
                        background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                      }
                    : undefined
                }
              >
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CrashDemo() {
  const { frame } = useFrames(FRAMES);
  return (
    <div className="flex w-full flex-col gap-3">
      <EventStrip current={frame.beat} crashed={frame.crash} />
      <DbRow sentAt={frame.sent} hot={frame.crash || frame.beat >= 1} wide={frame.extra} />
      {!frame.extra && (
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(16ch,0.8fr)]">
          <UglyFile
            name="celery_app.py"
            code={frame.crash ? TWO_WRITES_CRASH : TWO_WRITES}
            hot={frame.crash}
          />
          {frame.mail >= 2 && (
            <p className="m-0 self-center font-bold tracking-tighter text-accent">
              Inbox: reminder, reminder. Same day-2 email twice.
            </p>
          )}
        </div>
      )}
      {frame.extra && (
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-5">
          {WALL.map((f) => (
            <UglyFile key={f.name} name={f.name} code={f.code} added={f.added} className="max-h-[11rem]" />
          ))}
        </div>
      )}
    </div>
  );
}

export function CrashBetweenWritesSlide() {
  return (
    <Slide title="reminder_sent_at" layout="wide">
      <CrashDemo />
      <SpeakerNote>
        <p className="font-bold">04 reminder_sent_at / 04:00–05:15 / 1:15</p>
        <p className="italic">
          First frame: whole path grey. Walk 1 → 2, then the crash lands between send and write.
          Last step: the wall. Do not mention Temporal.
        </p>
        <p>
          Here's the awkward moment. The sweeper picked Ada. The provider accepts the email.
          Before we write reminder_sent_at, the worker dies. A deploy, an OOM, a spot instance —
          it doesn't matter.
        </p>
        <p>
          Look at the row. It still says NULL. That's all the next sweeper will see, so we send
          it again. Reverse the order — mark it sent first — and a crash can mean the email never
          goes out. Our transaction does not include SendGrid.
        </p>
        <p>
          So we invent more machinery. A lock so two sweepers don't grab the same row. Attempt
          counters. A retry job for the unacked sends. A checker that asks the provider whether
          that message-id already exists. Beat entries. An expire sweeper. A sweeper for the
          sweeper.
        </p>
        <p>
          The product is still four sentences. The implementation is now a small platform for
          remembering progress. We haven't changed the requirement. We're just trying to preserve
          it when processes stop at inconvenient moments.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
