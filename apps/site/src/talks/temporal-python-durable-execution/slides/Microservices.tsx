import type { ReactNode } from "react";
import { Slide, SpeakerNote, Tag, useFrames, useLoopFrames } from "@talks/slide-engine";

type Id =
  | "k-orders" | "k-inventory" | "k-payments" | "k-shipping" | "kafka"
  | "t-checkout" | "t-service" | "t-inventory" | "t-payments" | "t-shipping";

type Frame = {
  active: Id[];
  dead?: Id[];
  queue?: string;
  temporal: boolean;
  status: string;
  big?: boolean;
};

const FRAMES: Frame[] = [
  {
    active: ["k-orders", "k-inventory", "k-payments", "k-shipping", "kafka"],
    temporal: false,
    status: "Choreography: four teams, four services. Each reacts to events on the bus. The checkout exists only as the sum of their subscriptions.",
  },
  {
    active: ["t-checkout", "t-inventory", "t-payments", "t-shipping"],
    temporal: true,
    status: "Temporal: the same four teams, the same four deployables. Each runs a worker that polls its own task queue on the Temporal Service.",
  },
  {
    active: ["t-checkout", "t-service", "t-payments"],
    queue: "payments",
    temporal: true,
    status: "The workflow schedules charge_payment on the payments queue. The payments team's worker pulls it, runs it and reports back. No service calls another.",
  },
  {
    active: ["t-service"],
    dead: ["t-payments"],
    queue: "payments",
    temporal: true,
    status: "Payments is mid-deploy. The task waits on the queue and the workflow waits in history. Nothing lost, nothing sent twice.",
  },
  {
    active: ["t-checkout"],
    temporal: true,
    big: true,
    status: "Still a distributed system. But the process reads like a monolith: one function, one history, one place to look.",
  },
  {
    active: ["t-service"],
    temporal: true,
    status: "The cost: every step goes through the Temporal Service, and activity signatures become an API between teams.",
  },
];

const BORDER = { borderWidth: "var(--se-border-width)" } as const;

function Box({ id, frame, title, children }: { id: Id; frame: Frame; title: string; children?: ReactNode }) {
  const dead = frame.dead?.includes(id);
  const on = frame.active.includes(id);
  return (
    <div
      className={[
        "flex min-w-0 flex-col gap-0.5 border-border px-2.5 py-1.5 transition-colors duration-300",
        dead ? "bg-fg text-bg" : on ? "bg-accent text-accent-fg" : "bg-surface",
      ].join(" ")}
      style={BORDER}
    >
      <p className="m-0 truncate text-[0.95rem] font-bold tracking-tighter">{dead ? `${title} · deploying` : title}</p>
      {children && <div className="font-mono text-[0.72rem] leading-snug opacity-85">{children}</div>}
    </div>
  );
}

const Arrow = ({ label }: { label: string }) => (
  <p className="m-0 text-center font-mono text-[0.72rem] text-muted">{label}</p>
);

function Choreography({ frame }: { frame: Frame }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Tag>Choreography · Kafka</Tag>
      <div className="grid grid-cols-2 gap-2">
        <Box id="k-orders" frame={frame} title="orders">emits OrderPlaced</Box>
        <Box id="k-inventory" frame={frame} title="inventory">hears OrderPlaced · PaymentFailed</Box>
      </div>
      <Arrow label="↕ publish · subscribe ↕" />
      <div
        className={["flex items-center justify-between gap-2 px-3 py-2 font-mono text-[0.8rem] font-bold transition-colors duration-300", frame.active.includes("kafka") ? "bg-fg text-bg" : "bg-fg/10"].join(" ")}
      >
        <span>kafka</span>
        <span className="truncate font-normal">order · inventory · payment · shipment topics</span>
      </div>
      <Arrow label="↕ publish · subscribe ↕" />
      <div className="grid grid-cols-2 gap-2">
        <Box id="k-payments" frame={frame} title="payments">hears InventoryReserved · ShipmentTimedOut</Box>
        <Box id="k-shipping" frame={frame} title="shipping">deadline table + sweeper</Box>
      </div>
      <p className="m-0 font-mono text-[0.72rem] text-muted">the process: in no single place</p>
    </div>
  );
}

const QUEUES = ["checkout", "inventory", "payments", "shipping"];

function Temporal({ frame }: { frame: Frame }) {
  return (
    <div className={["flex min-w-0 flex-col gap-2 transition-opacity duration-500", frame.temporal ? "opacity-100" : "opacity-15"].join(" ")}>
      <Tag>Orchestration · Temporal</Tag>
      <Box id="t-checkout" frame={frame} title="orders team · checkout worker">
        Fulfillment workflow: reserve → charge → wait 3 days → undo
      </Box>
      <Arrow label="↑ poll · commands ↓" />
      <div
        className={["flex flex-col gap-1.5 border-border px-2.5 py-2 transition-colors duration-300", frame.active.includes("t-service") ? "bg-fg text-bg" : "bg-fg/10"].join(" ")}
        style={{ ...BORDER, borderStyle: "dashed" }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="m-0 text-[0.95rem] font-bold tracking-tighter">Temporal Service</p>
          <span className="truncate font-mono text-[0.72rem]">history · timers · task queues</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUEUES.map((q) => (
            <span
              key={q}
              className={["px-1.5 py-0.5 font-mono text-[0.72rem] font-bold transition-colors duration-300", frame.queue === q ? "bg-accent text-accent-fg" : "bg-bg text-fg"].join(" ")}
            >
              {q}
              {frame.queue === q ? " · charge_payment" : ""}
            </span>
          ))}
        </div>
      </div>
      <Arrow label="↑ poll · results ↑" />
      <div className="grid grid-cols-3 gap-2">
        <Box id="t-inventory" frame={frame} title="inventory worker">reserve · release</Box>
        <Box id="t-payments" frame={frame} title="payments worker">charge · refund</Box>
        <Box id="t-shipping" frame={frame} title="shipping">warehouse → signal</Box>
      </div>
      <p className="m-0 font-mono text-[0.72rem] text-muted">the process: one function, one history</p>
    </div>
  );
}

function Microservices() {
  const { step } = useFrames([0, 1]);
  if (step === 0) {
    return (
      <div className="flex flex-col gap-6">
        <p className="m-0 max-w-[16ch] text-[clamp(3rem,9cqw,7.5rem)] leading-[0.86] font-bold tracking-tighter">So what about microservices?</p>
        <p className="m-0 text-[clamp(1.05rem,2cqw,1.4rem)] text-muted">Four teams, four services, one checkout.</p>
      </div>
    );
  }
  // Mounted on Next, so the loop always starts from its first beat.
  return <Diagrams />;
}

function Diagrams() {
  const { frame } = useLoopFrames(FRAMES, { stepMs: 4500, holdMs: 5500 });
  return (
    <div className="flex flex-col gap-4">
      <p aria-hidden className="m-0 text-[clamp(1.5rem,3.4cqw,2.6rem)] leading-[0.95] font-bold tracking-tighter">So what about microservices?</p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Choreography frame={frame} />
        <Temporal frame={frame} />
      </div>
      <p
        className={[
          "m-0 min-h-[2.6em] leading-snug font-bold tracking-tighter",
          frame.big ? "text-[clamp(1.3rem,2.6cqw,2rem)] text-accent" : "text-[clamp(1.05rem,1.9cqw,1.4rem)]",
        ].join(" ")}
      >
        {frame.status}
      </p>
    </div>
  );
}

export function MicroservicesSlide() {
  return (
    <Slide title="A distributed system that reads like a monolith" hideTitle layout="wide">
      <Microservices />
      <SpeakerNote>
        <p className="font-bold">25 A distributed system that reads like a monolith / 36:15–38:00 / 1:45</p>
        <p className="italic">The question alone, full screen. Ask it and wait a beat. Press Next once: the diagrams then loop by themselves, about 4½ seconds a beat — choreography, Temporal, one task, a dead worker, the monolith line, the cost. Talk over the loop; don't wait for it.</p>
        <p>So what about microservices? We don't have one Python process. We have four teams and four services, and the checkout crosses all of them.</p>
        <p className="italic">Loop: choreography.</p>
        <p>The usual answer is choreography. Each service publishes events and reacts to other services' events on Kafka. Orders emits OrderPlaced, inventory hears it, payments hears InventoryReserved, and shipping keeps a deadline table. Nobody owns the checkout. It's the sum of the subscriptions.</p>
        <p className="italic">Loop: Temporal.</p>
        <p>With Temporal, the same four teams still ship the same four deployables. What changes is who coordinates. The Temporal Service holds the history, the timers and the task queues. The orders team runs a worker with the Fulfillment workflow. Inventory and payments each run a worker with their own activities, on their own task queue. Workers only ever connect out to the service and poll.</p>
        <p className="italic">Loop: one task.</p>
        <p>When the workflow reaches charge_payment, it schedules it with task_queue equals "payments". The service stores that task. The payments team's worker — its own process, its own deploy, maybe its own language — pulls it, runs it and reports the result. Payments never calls inventory. Nobody calls anybody. The service orchestrates the nodes.</p>
        <p className="italic">Loop: payments deploys.</p>
        <p>Payments is mid-deploy, no workers up. The task waits on the queue. The workflow waits in history. When the new worker starts polling, it picks the task up. No retry topic, no dead-letter queue.</p>
        <p className="italic">Loop: the monolith line. Slow down.</p>
        <p>So you still have a distributed system: separate processes, separate deploys, a network between them. But the process reads like a monolith. One function you can read top to bottom, one history, one place to look when order 1042 is stuck.</p>
        <p className="italic">Loop: the cost.</p>
        <p>Honest cost: the Temporal Service is the one thing every step goes through — if it's down, progress pauses, though nothing is lost. And activity names and arguments are now an API between teams; changing charge_payment's signature is a cross-team change, just like changing an event schema.</p>
        <p>Transition: so how do I actually pick?</p>
      </SpeakerNote>
    </Slide>
  );
}
