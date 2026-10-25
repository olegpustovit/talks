import { Slide, SpeakerNote } from "@talks/slide-engine";
import { TrialLog } from "../TrialLog";

const LOG = [
  "$ python trial.py",
  "trial started",
  "waiting until day 2",
  "sending reminder",
  "email sent",
  "process killed",
  "new process starting",
  "reminder already sent — skip",
  "waiting until day 10",
];

export function TitleSlide() {
  return (
    <Slide title="Durable Python" layout="title" kicker="2026">
      <div className="flex flex-col gap-7">
        <div className="h-[3px] w-14 bg-fg" />
        <p className="m-0 max-w-[22ch] text-[clamp(1.35rem,2.7cqw,2.05rem)] font-bold leading-[1.05] tracking-tighter text-muted">
          from running custom SQS workers and Celery to Temporal
        </p>
        <p className="m-0 text-[clamp(1.05rem,1.8cqw,1.25rem)] font-bold tracking-tighter text-accent">
          Oleg Pustovit
        </p>
      </div>
      <TrialLog lines={LOG} className="mt-auto h-[16rem] max-w-[36rem] shrink-0 text-[0.9rem]" />
      <SpeakerNote>
        <p className="font-bold">01 Durable Python / 00:00–01:30 / 1:30</p>
        <p className="italic">Desire first. Temporal is in the subtitle; don't say it out loud. The tool comes in the middle of the talk (slide 13).</p>
        <p>
          Hi everyone, I'm Oleg Pustovit. I work at Exponential Ventures, a Silicon Valley startup
          accelerator. My work involves research and development across web applications, AI,
          robotics, and full-stack systems for early-stage startups.
        </p>
        <p>
          You've probably built the same thing I have. A piece of business logic that needs to keep
          going after the process running it disappears. Custom SQS workers. Celery. Cron plus a
          few flags on a table. It works, until a deploy, a crash, or a retry sends the email twice
          — or never.
        </p>
        <p>
          Today I want to walk through an approach that may help with that. A way to keep the
          work's place when the machine is gone — so the next background feature you write, or the
          next one an AI assistant writes for you, doesn't quietly lose its progress.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
