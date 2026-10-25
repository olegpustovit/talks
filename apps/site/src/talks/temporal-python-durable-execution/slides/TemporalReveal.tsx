import { Caption, CodeEditor, Slide, SpeakerNote, useFrames } from "@talks/slide-engine";
import { TRIAL_CODE } from "../runtimeSnippets";

const withImport = (runtime: string) =>
  `from datetime import timedelta\nfrom ${runtime} import activity, workflow\n\n${TRIAL_CODE}`;
const STAGES = [withImport("toy_runtime"), withImport("temporalio")];

function Reveal() {
  const { step, frame } = useFrames(STAGES);
  return (
    <div className="flex flex-col gap-3">
      <CodeEditor code={frame} language="python" editable={false} filename="trial.py" />
      <Caption>{step === 0 ? "The workflow we just ran." : "One import changed. This is valid Temporal Python."}</Caption>
    </div>
  );
}

export function TemporalRevealSlide() {
  return (
    <Slide title="Now change the imports" hideTitle layout="wide">
      <Reveal />
      <SpeakerNote>
        <p className="font-bold">13 Now change the imports / 19:30–20:15 / 0:45</p>
        <p>Here is the whole workflow we just watched survive a crash, with our toy-runtime import at the top. The three activities sit above it in the same file.</p>
        <p className="italic">Press Next once. Let the room find the changed line.</p>
        <p>Look at that. This is valid Temporal Python. We chose our toy API to match the SDK. The workflow body and the activities stay exactly the same.</p>
        <p>The runtime behind these names changes completely. Temporal supplies durable history, timer scheduling, activity dispatch, retries, and recovery. The JSON-lines implementation was a model, not Temporal's internals. You still register this workflow and all three activities on a worker connected to the service.</p>
        <p>Transition: so what can you actually build with this? Six systems: two properly, then four quickly.</p>
        <p>SDK reference: https://github.com/temporalio/sdk-python#implementing-a-workflow. Local business I/O is a stand-in; no real email is sent by the example.</p>
      </SpeakerNote>
    </Slide>
  );
}
