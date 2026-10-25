import { Caption, Slide, SpeakerNote } from "@talks/slide-engine";

export function BetterPromptSlide() {
  return (
    <Slide title="A better prompt for background work" kicker="The practical takeaway" layout="wide">
      <ol className="m-0 flex list-none flex-col gap-5 p-0">
        <li className="m-0 flex items-baseline gap-4">
          <span className="font-bold tracking-tighter text-accent">1</span>
          <p className="m-0 text-[clamp(1.4rem,3.2cqw,2.2rem)] font-bold leading-[1.05] tracking-tighter">
            What must survive a restart?
          </p>
        </li>
        <li className="m-0 flex items-baseline gap-4">
          <span className="font-bold tracking-tighter text-accent">2</span>
          <p className="m-0 text-[clamp(1.4rem,3.2cqw,2.2rem)] font-bold leading-[1.05] tracking-tighter">
            Which effects may repeat?
          </p>
        </li>
        <li className="m-0 flex items-baseline gap-4">
          <span className="font-bold tracking-tighter text-accent">3</span>
          <p className="m-0 text-[clamp(1.4rem,3.2cqw,2.2rem)] font-bold leading-[1.05] tracking-tighter">
            Who owns recovery?
          </p>
        </li>
      </ol>
      <Caption>Does not force Temporal. Forces an execution model before the plumbing around an accidental choice.</Caption>
      <SpeakerNote>
        <p className="font-bold">26 A better prompt for background work / 35:30–37:00 / 1:30</p>
        <p className="italic">Slow down here. These questions are the practical takeaway.</p>
        <p>Three questions for whatever you build next, whether or not the answer is a workflow. When I ask an AI assistant for a background feature, I want to specify these along with the happy path.</p>
        <p>What must survive a restart? That could include the current step, a deadline, an approval, or the identity of an operation already attempted.</p>
        <p>Which effects may repeat? Reading a document and charging a card have very different consequences. The implementation should make that difference visible.</p>
        <p>Who owns recovery? Is the application rebuilding state from rows? Is a queue retrying one task? Is a workflow runtime coordinating the whole sequence? Whichever answer we choose, somebody needs to own the behavior.</p>
        <p>
          A more useful prompt for our example would be: design a fourteen-day trial process that
          survives worker restarts, preserves signup-based deadlines, and handles duplicate
          activity attempts. Compare a scheduled-job design with a durable workflow, and show the
          failure boundaries.
        </p>
        <p>That doesn't force the answer to be Temporal. It forces us to consider the execution model before we spend time polishing the plumbing around an accidental choice.</p>
      </SpeakerNote>
    </Slide>
  );
}
