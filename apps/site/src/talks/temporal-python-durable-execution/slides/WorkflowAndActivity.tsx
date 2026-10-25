import { Caption, Slide, SpeakerNote, useFrames } from "@talks/slide-engine";

const FRAMES = [
  { label: "The model", caption: "A workflow decides what happens next. An activity touches the outside world." },
  { label: "First execution", caption: "The workflow calls an activity and waits for its result." },
  { label: "Record", caption: "Save the activity result in durable history, then continue the workflow." },
  { label: "Replay", caption: "Run the workflow again. Return the saved result at the same activity call." },
];

function Model() {
  const { step, frame } = useFrames(FRAMES);
  const replay = step === 3;
  const recorded = step >= 2;
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
        <span className="text-accent">{frame.label}</span>
        <span className="text-muted">{step + 1} / {FRAMES.length}</span>
      </div>
      <svg viewBox="0 0 1100 470" className="w-full" style={{ maxHeight: "49cqh" }} role="img" aria-label={`${frame.label}: workflow calls a side-effecting activity; durable history stores the result and returns it on replay.`}>
        <defs>
          <marker id="model-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8" className="fill-accent" />
          </marker>
        </defs>

        {/* Stable positions keep the mental model intact as the route changes. */}
        <rect x="35" y="35" width="360" height="225" rx="12" className="fill-surface stroke-fg" strokeWidth="2" />
        <text x="65" y="82" className="fill-fg" fontSize="32" fontWeight="750">Workflow</text>
        <text x="65" y="115" className="fill-muted" fontSize="20">Deterministic imperative code</text>
        <path d="M70 148 V224" className="stroke-muted" strokeWidth="2" />
        {[155, 185, 215].map((y, i) => <circle key={y} cx="70" cy={y} r="5" className={i === 1 && step > 0 ? "fill-accent" : "fill-fg"} />)}
        <text x="90" y="161" className="fill-fg" fontSize="20" fontFamily="monospace">if trial_expired:</text>
        <rect x="84" y="167" width="285" height="28" rx="4" className="fill-accent" opacity={step > 0 ? 0.18 : 0} />
        <text x="90" y="191" className="fill-fg" fontSize="20" fontFamily="monospace">  await send_email()</text>
        <text x="90" y="221" className="fill-fg" fontSize="20" fontFamily="monospace">continue...</text>

        <g opacity={replay ? 0.35 : 1}>
          <rect x="710" y="35" width="355" height="225" rx="12" className="fill-surface stroke-fg" strokeWidth="2" />
          <text x="740" y="82" className="fill-fg" fontSize="32" fontWeight="750">Activity</text>
          <text x="740" y="115" className="fill-muted" fontSize="20">Side effects / I/O</text>
          <text x="740" y="166" className="fill-fg" fontSize="23" fontFamily="monospace">send_email()</text>
          <path d="M742 186 H1028" className="stroke-muted" />
          <text x="740" y="222" className="fill-muted" fontSize="20">Email provider · database · API</text>
        </g>

        <g opacity={replay ? 0.2 : 1}>
          <path d="M405 145 H695" className="stroke-accent" strokeWidth="3" fill="none" markerEnd="url(#model-arrow)" />
          <text x="550" y="128" textAnchor="middle" className="fill-fg" fontSize="20">{replay ? "No new call" : "Call activity"}</text>
        </g>
        {step === 1 && <circle cx="552" cy="145" r="8" className="fill-accent" />}

        <rect x="355" y="335" width="390" height="112" rx="12" className="fill-surface stroke-accent" strokeWidth="2" />
        <text x="550" y="375" textAnchor="middle" className="fill-fg" fontSize="26" fontWeight="750">Durable history</text>
        <text x="550" y="414" textAnchor="middle" className={recorded ? "fill-accent" : "fill-muted"} fontSize="22" fontFamily="monospace">
          {recorded ? 'send_email → {"sent": true}' : "No recorded result yet"}
        </text>

        <g opacity={recorded && !replay ? 1 : 0.15}>
          <path d="M890 270 V390 H760" className="stroke-accent" strokeWidth="3" fill="none" markerEnd="url(#model-arrow)" />
          <text x="910" y="319" className="fill-fg" fontSize="20">Save result</text>
        </g>
        <g opacity={recorded ? 1 : 0.15}>
          <path d="M340 390 H215 V275" className="stroke-accent" strokeWidth={replay ? 5 : 3} fill="none" markerEnd="url(#model-arrow)" />
          <text x="35" y="319" className="fill-fg" fontSize="20">{replay ? "Replay result" : "Return result"}</text>
        </g>
        {replay && <text x="888" y="292" textAnchor="middle" className="fill-muted" fontSize="19">Already recorded. Activity stays idle.</text>}
      </svg>
      <Caption>{frame.caption}</Caption>
    </div>
  );
}

export function WorkflowAndActivitySlide() {
  return (
    <Slide title="Replay the workflow from saved results" kicker="Durable execution" layout="wide">
      <Model />
      <SpeakerNote>
        <p className="font-bold">09 Replay the workflow from saved results / 11:00–12:15 / 1:15</p>
        <p>Start with the two boxes. A workflow is a function containing deterministic imperative code: conditions, loops, and waits. Activities contain the side effects. send_email here is the same kind of call as send_reminder in our infinite-computer example.</p>
        <p>Next: follow the arrow to the activity. It sends the email and returns a result. Next: the runtime records that result durably before giving it back to the workflow. The storage survives the worker.</p>
        <p>Next: restart the workflow from the beginning. At this recorded activity call, history supplies the previous result. The activity stays idle. Once replay reaches a call without a recorded result, execution can do new work. Determinism makes the workflow follow the same sequence of calls.</p>
        <p>This is a simplified teaching model of activity results. An effect whose completion was never recorded may run again, so activities still need idempotency. Do not introduce a framework here. Next we go back to our trial code, then build the tiny runtime in Python.</p>
      </SpeakerNote>
    </Slide>
  );
}
