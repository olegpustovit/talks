import { Slide, SpeakerNote } from "@talks/slide-engine";
import { TrialLog } from "../TrialLog";

// Picks up where the title's log stopped: the same process, to the end of the trial.
const LOG = [
  "waiting until day 10",
  "process killed",
  "new process starting",
  "reminder already sent — skip",
  "sending tips",
  "waiting until day 14",
  "trial ended",
];

export function ClosingSlide() {
  return (
    <Slide title="Outlive the machine" layout="title">
      <div className="flex flex-col gap-7">
        <div className="h-[3px] w-14 bg-fg" />
        <p className="m-0 max-w-[24ch] text-[clamp(1.35rem,2.7cqw,2.05rem)] font-bold leading-[1.05] tracking-tighter text-muted">
          We don't have infinitely reliable computers.
        </p>
        <p className="m-0 text-[clamp(1.05rem,1.8cqw,1.25rem)] font-bold tracking-tighter text-muted">Oleg Pustovit</p>
      </div>
      <TrialLog lines={LOG} className="mt-auto h-[16rem] max-w-[36rem] shrink-0 text-[0.9rem]" />
      <SpeakerNote>
        <p className="font-bold">28 Outlive the machine / 40:15–41:15 / 1:00, then Q&amp;A</p>
        <p className="italic">Same layout and log as the title slide; the process finishes. Leave this up for Q&amp;A.</p>
        <p>
          We don't have infinitely reliable computers. We never will. But we can write code that keeps its
          place when the machine doesn't — and keep the code as simple as the thing we meant to build.
        </p>
        <p>Thank you.</p>
        <p className="italic">If asked where to start: shrink the trial to seconds, kill the worker mid-wait, restart it, look at the history. Then kill it between the send and the save. docs.temporal.io/develop/python and github.com/temporalio/samples-python.</p>
        <p className="italic">Q&amp;A opener: what background process do you have that's hard to recover today?</p>
      </SpeakerNote>
    </Slide>
  );
}
