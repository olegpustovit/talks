import { Caption, CodeEditor, Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";
import { runtimeSnippet } from "../runtimeSnippets";

const inWorkflow = (name: string) => `class Workflow:\n${runtimeSnippet(name)}`;

const PIECES = [
  {
    title: "Workflow",
    code: runtimeSnippet("init"),
    note: "Load the history from disk. Start reading it at position 0.",
  },
  {
    title: "save",
    code: inWorkflow("save"),
    note: "Write every event to a file. The file outlives the worker.",
  },
  {
    title: "execute_activity",
    code: inWorkflow("execute_activity"),
    note: "Done before? Return the saved result. First time? Run it, then save the result.",
  },
  {
    title: "sleep",
    code: inWorkflow("sleep"),
    note: "Same trick for waiting: save the deadline, not the duration.",
  },
  {
    title: "The tiny API",
    code: `${inWorkflow("decorators")}\n\n\n${runtimeSnippet("api")}`,
    note: "workflow.defn · workflow.run · workflow.sleep · workflow.execute_activity · activity.defn",
  },
];

function BuildRuntime() {
  const { step, frame } = useFrames(PIECES);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PIECES.map((piece, i) => (
          <Tag key={piece.title} accent={i === step} className={i > step ? "opacity-30" : ""}>
            {piece.title}
          </Tag>
        ))}
      </div>
      <div className="min-h-[18rem]">
        <CodeEditor code={frame.code} language="python" editable={false} filename="toy_runtime.py" />
      </div>
      <Caption>{frame.note}</Caption>
    </div>
  );
}

export function TinyReplayRuntimeSlide() {
  return (
    <Slide title="Let's build a runtime that remembers" kicker="One function at a time" layout="wide">
      <BuildRuntime />
      <SpeakerNote>
        <p className="font-bold">11 Let's build a runtime that remembers / 13:00–16:00 / 3:00</p>
        <p className="italic">Each arrow reveals one function of the runnable examples/toy_runtime.py. Imports are in the source file.</p>
        <p>Workflow. When it starts, it reads its history from a file, one JSON event per line. The cursor says how far into that history we are. A fresh worker always starts at zero.</p>
        <p>save. Write one line, and force it to disk before we move on. Once save returns, that event survives the worker.</p>
        <p>execute_activity. This is the whole trick. Is there already an event at this position? Then this work happened before a crash: return the saved result and don't call the function. No event? Call the function, save its result, return it. Either way, move the cursor forward one.</p>
        <p>sleep. Same shape. The first time, save the deadline, not the duration. A new worker reads that same deadline and only waits for the time that's left.</p>
        <p>The decorators do nothing in our toy; they just hand back what they were given. workflow and activity are the names the next slide uses. We picked them on purpose.</p>
        <p>Honest cost: one workflow, one worker, one file. It doesn't check that replayed code makes the same calls in the same order. No retries. The timeout option is accepted and ignored. And if the worker dies after sending the email but before save, the email goes out again.</p>
      </SpeakerNote>
    </Slide>
  );
}
