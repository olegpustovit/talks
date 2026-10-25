import { Slide, SpeakerNote } from "@talks/slide-engine";

export function NextBackgroundFeatureSlide() {
  return (
    <Slide title="Could this be a workflow?">
      <p className="text-muted">Before you build the second sweeper.</p>
      <SpeakerNote>
        <p className="font-bold">27 Could this be a workflow? / 39:15–40:15 / 1:00</p>
        <p className="italic">Slow down. This is the point of the talk. Pause after the question.</p>
        <p>
          I only came across this model about six months ago, and that's why I wanted to give this talk.
          Useful patterns are easy to miss when our tools keep pointing us at the ones we already know.
        </p>
        <p>
          We started with a trial that was four sentences, and watched it turn into cron, sweepers, flags
          and locks. Every one of us has built that homegrown workflow engine, one status column at a
          time.
        </p>
        <p>
          This isn't about Temporal. It's about having another shape in your toolset: a function that keeps
          its place. Sleep, call, wait, undo — written the way the product reads.
        </p>
        <p>
          So next time you're about to add the second sweeper, stop and sketch it as a workflow first. What
          must survive a restart? Which effects may repeat? Who owns recovery? Even if you still build it
          with cron, you'll build the simpler version.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
