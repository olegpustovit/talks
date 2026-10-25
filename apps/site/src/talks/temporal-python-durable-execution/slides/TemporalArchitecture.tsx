import type { ReactNode } from "react";
import { Slide, SpeakerNote, Tag, useLoopFrames } from "@talks/slide-engine";

type NodeId = "client" | "workers" | "frontend" | "history" | "matching" | "system" | "persistence" | "visibility";

type Frame = { active: NodeId[]; status: string; owner?: "self" | "cloud" };

const SERVICE: NodeId[] = ["frontend", "history", "matching", "system"];
const STORES: NodeId[] = ["persistence", "visibility"];

const FRAMES: Frame[] = [
  { active: [], status: "Your code only ever talks to one gRPC endpoint." },
  { active: ["client", "frontend"], status: "1. The client calls StartWorkflowExecution on Frontend." },
  { active: ["frontend", "history", "persistence"], status: "2. History owns the workflow's shard and writes its first events to the persistence store." },
  { active: ["history", "matching"], status: "3. Matching puts a workflow task on the task queue." },
  { active: ["workers", "frontend", "matching"], status: "4. A worker long-polls, runs your code until it blocks, and sends back commands." },
  { active: ["history", "persistence"], status: "5. History turns commands into events and timers into timer tasks, in one transaction." },
  { active: ["history", "visibility"], status: "6. A copy goes to the visibility store, so the Web UI and CLI can list and search." },
  { active: [...SERVICE, ...STORES], owner: "self", status: "Self-hosted: you run four services, two databases, and a shard count you can never change." },
  { active: ["client", "workers"], owner: "cloud", status: "Temporal Cloud runs the service and databases. You still run workers, and pay per action plus storage." },
];

const NODES: Record<NodeId, { title: string; tag: string; detail: string }> = {
  client: { title: "Client", tag: "your API", detail: "starts workflows, sends signals" },
  workers: { title: "Workers", tag: "your Python", detail: "poll task queues, run your code" },
  frontend: { title: "Frontend", tag: "gRPC :7233", detail: "auth, rate limits, routing. Stateless." },
  history: { title: "History", tag: "shards 1…N", detail: "each workflow's events, timers and state" },
  matching: { title: "Matching", tag: "task queues", detail: "hands tasks to polling workers" },
  system: { title: "Worker service", tag: "internal", detail: "Temporal's own system workflows" },
  persistence: { title: "Persistence", tag: "Cassandra · PostgreSQL · MySQL", detail: "histories, timers, task backlogs. The source of truth." },
  visibility: { title: "Visibility", tag: "Elasticsearch · OpenSearch · SQL", detail: "a searchable copy for listing workflows" },
};

function Node({ id, frame }: { id: NodeId; frame: Frame }) {
  const node = NODES[id];
  const on = frame.active.includes(id);
  return (
    <div
      className={["flex min-w-0 flex-col gap-1 border-border px-3 py-2 transition-colors duration-300", on ? "bg-accent text-accent-fg" : "bg-surface"].join(" ")}
      style={{ borderWidth: "var(--se-border-width)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="m-0 text-[clamp(1rem,1.6cqw,1.2rem)] font-bold tracking-tighter">{node.title}</p>
        <p className={["m-0 font-mono text-[0.75rem]", on ? "" : "text-muted"].join(" ")}>{node.tag}</p>
      </div>
      <p className={["m-0 text-[0.85rem] leading-snug", on ? "" : "text-muted"].join(" ")}>{node.detail}</p>
    </div>
  );
}

function Column({ label, owner, dim, dashed, children }: { label: string; owner?: string; dim?: boolean; dashed?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{label}</Tag>
        {owner && <Tag accent>{owner}</Tag>}
      </div>
      <div
        className={["flex flex-1 flex-col gap-2 transition-opacity duration-300", dashed ? "border-border p-2" : "", dim ? "opacity-40" : "opacity-100"].join(" ")}
        style={dashed ? { borderWidth: "var(--se-border-width)", borderStyle: "dashed" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function Link({ label }: { label: string }) {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <span className="font-mono text-[0.75rem] font-bold whitespace-nowrap text-muted">{label}</span>
    </div>
  );
}

function Architecture() {
  const { frame } = useLoopFrames(FRAMES, { stepMs: 4500, holdMs: 6000 });
  const cloud = frame.owner === "cloud";
  const self = frame.owner === "self";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,0.8fr)_auto_minmax(0,2fr)_auto_minmax(0,1.1fr)]">
        <Column label="Your code" owner={frame.owner ? "always yours" : undefined}>
          <Node id="client" frame={frame} />
          <Node id="workers" frame={frame} />
        </Column>
        <Link label="gRPC ⇄" />
        <Column label="Temporal Service" owner={self ? "you run this" : cloud ? "Temporal Cloud" : undefined} dim={cloud} dashed>
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            {SERVICE.map((id) => (
              <Node key={id} id={id} frame={frame} />
            ))}
          </div>
        </Column>
        <Link label="SQL / CQL ⇄" />
        <Column label="Two databases" owner={self ? "you run this" : cloud ? "Temporal Cloud" : undefined} dim={cloud}>
          {STORES.map((id) => (
            <Node key={id} id={id} frame={frame} />
          ))}
        </Column>
      </div>
      <p className="m-0 min-h-[2.6em] text-[clamp(1.1rem,2cqw,1.5rem)] leading-snug font-bold tracking-tighter">{frame.status}</p>
    </div>
  );
}

export function TemporalArchitectureSlide() {
  return (
    <Slide title="One endpoint, four services, two databases" kicker="Under the hood" layout="wide">
      <Architecture />
      <SpeakerNote>
        <p className="font-bold">23 One endpoint, four services, two databases / 32:45–35:15 / 2:30</p>
        <p className="italic">Loops by itself, about 4½ seconds a beat: one workflow start, then who runs what. No need to press Next; talk over the loop. Take your time; this is for the people who want to self-host.</p>
        <p>Your client and your workers talk to exactly one endpoint.</p>
        <p className="italic">→ 1. Client → Frontend.</p>
        <p>Frontend is a stateless gRPC gateway on port 7233. It authenticates, rate-limits and routes.</p>
        <p className="italic">→ 2. History writes to Persistence.</p>
        <p>History is the heart. Every workflow belongs to one shard, picked by hashing its namespace and workflow ID, and one History host owns each shard at a time. That's how Temporal guarantees one running workflow per ID without a global lock. It writes the first events to Persistence, the source of truth: histories, workflow state, timers, task backlogs. Cassandra, PostgreSQL or MySQL, and SQLite only for development.</p>
        <p className="italic">→ 3. Matching. → 4. Workers poll.</p>
        <p>Matching hosts the task queues. Workers long-poll it. If a worker is already waiting, the task goes straight to it without touching the database. The worker runs your code until it blocks and sends back commands: schedule this activity, start this timer.</p>
        <p className="italic">→ 5. One transaction.</p>
        <p>The trick is one transaction: History appends the events, updates the workflow's state and inserts its timer and transfer tasks together. A million sleeping workflows is a million timer rows and nothing in your workers.</p>
        <p className="italic">→ 6. Visibility.</p>
        <p>Visibility is a searchable copy for the list page: Elasticsearch or OpenSearch, or MySQL or PostgreSQL. The Web UI that ships with the CLI reads from it. It's eventually consistent, so never build logic on "list, then act."</p>
        <p className="italic">→ Self-hosted.</p>
        <p>Self-hosting means four services to scale — the fourth, the Worker service, is Temporal running its own system workflows — two databases to operate, and numHistoryShards, which you pick once and can never change. The Helm chart defaults to 512.</p>
        <p className="italic">→ Cloud.</p>
        <p>Or Temporal Cloud runs the service and databases, and you still run workers. Pricing, checked September 2026: $50 per million actions at the base rate, plus active and retained storage.</p>
        <p>My rule of thumb: if nobody on your team is already on call for a stateful distributed database, start on Cloud.</p>
      </SpeakerNote>
    </Slide>
  );
}
