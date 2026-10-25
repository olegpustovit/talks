import { Caption, CodeEditor, Slide, SpeakerNote } from "@talks/slide-engine";
import { IMPERATIVE_CODE } from "../runtimeSnippets";

export function ApplyWorkflowsQuestionSlide() {
  return (
    <Slide title="How do we apply workflows to this code?" kicker="Our infinite machine" layout="wide">
      <CodeEditor code={IMPERATIVE_CODE} language="python" editable={false} filename="trial.py" />
      <Caption>The same trial. Day 2, day 10, day 14.</Caption>
      <SpeakerNote>
        <p className="font-bold">10 How do we apply workflows to this code? / 12:15–13:00 / 0:45</p>
        <p>Here is our infinite-machine code again. Sleep two days, send the reminder. Sleep eight more, send tips. Four more, expire if unpaid. DAY is 86,400 seconds. The business functions are the existing side effects.</p>
        <p>We now have a mental model of workflows and activities. How do we apply it to a piece of code like this?</p>
        <p className="italic">Pause on the question. Do not transform the code yet. Advance to slide 11.</p>
        <p>To answer that, let's build the smallest runtime that can remember an activity result.</p>
      </SpeakerNote>
    </Slide>
  );
}
