import { CodeEditor, ScenePanel, Slide, SpeakerNote, StepRow, useLoopFrames, type StepState } from "@talks/slide-engine";
import { at, caseSnippet } from "../caseCode";

const CODE = `${caseSnippet("tenant")}\n\n${caseSnippet("certificate")}`;

const STEPS = [
  { label: "create_database", detail: "schema acme" },
  { label: "create_dns_record", detail: "acme.shop.app" },
  { label: "wait_for_certificate", detail: "" },
  { label: "seed_tenant", detail: "demo data" },
];

type Worker = "idle" | "busy" | "dead";

type Frame = {
  lines: number[];
  steps: StepState[];
  certificate: string;
  workers: Worker[];
  live: boolean;
  status: string;
  ms?: number;
};

const POLL = at(CODE, "while not await", 3);

const FRAMES: Frame[] = [
  { lines: [], steps: ["idle", "idle", "idle", "idle"], certificate: "", workers: ["idle", "idle", "idle"], live: false, status: "Acme signs the contract. Nothing exists yet." },
  { lines: at(CODE, "create_database,", 2, -1), steps: ["active", "idle", "idle", "idle"], certificate: "", workers: ["busy", "idle", "idle"], live: false, status: "Create their database schema." },
  { lines: at(CODE, "create_dns_record,", 2, -1), steps: ["done", "active", "idle", "idle"], certificate: "", workers: ["busy", "idle", "idle"], live: false, status: "Point acme.shop.app at the load balancer." },
  { lines: [...at(CODE, "wait_for_certificate, t,", 4, -1), ...POLL], steps: ["done", "done", "active", "idle"], certificate: "pending", workers: ["idle", "busy", "idle"], live: false, status: "Wait for the TLS certificate. The activity polls and heartbeats every 30 s.", ms: 2200 },
  { lines: at(CODE, "heartbeat_timeout"), steps: ["done", "done", "active", "idle"], certificate: "no heartbeat", workers: ["idle", "dead", "idle"], live: false, status: "worker-2 dies mid-poll. Two minutes pass without a heartbeat.", ms: 2600 },
  { lines: POLL, steps: ["done", "done", "active", "idle"], certificate: "retry on worker-3", workers: ["idle", "dead", "busy"], live: false, status: "Temporal retries the activity on worker-3. The workflow never notices." },
  { lines: POLL, steps: ["done", "done", "done", "idle"], certificate: "issued after 40 min", workers: ["idle", "dead", "idle"], live: false, status: "The certificate is issued after 40 minutes." },
  { lines: at(CODE, "seed_tenant,", 2, -1), steps: ["done", "done", "done", "active"], certificate: "issued after 40 min", workers: ["busy", "dead", "idle"], live: false, status: "Seed their demo data." },
  { lines: at(CODE, 'return f"https://'), steps: ["done", "done", "done", "done"], certificate: "issued after 40 min", workers: ["idle", "dead", "idle"], live: true, status: "acme.shop.app is live." },
];

const WORKER: Record<Worker, string> = {
  idle: "bg-bg text-muted",
  busy: "bg-accent text-accent-fg",
  dead: "bg-fg text-bg line-through",
};

function Provisioning({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="Provisioning · Acme" meta="enterprise plan" status={frame.status}>
      <div className="flex items-center gap-2 border-border bg-bg px-3 py-2 font-mono text-[0.85rem]" style={{ borderWidth: "var(--se-border-width)" }}>
        <span className={["shrink-0 px-1.5 text-[0.7rem] font-bold transition-colors duration-300", frame.live ? "bg-accent text-accent-fg" : "bg-fg/10 text-muted"].join(" ")}>
          {frame.live ? "https" : "404"}
        </span>
        <span className={["truncate transition-colors duration-300", frame.live ? "font-bold" : "text-muted"].join(" ")}>acme.shop.app</span>
      </div>
      <div className="flex flex-col gap-1">
        {STEPS.map((step, i) => (
          <StepRow key={step.label} label={step.label} detail={(i === 2 ? frame.certificate : step.detail) || undefined} state={frame.steps[i]!} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[0.8rem] font-bold tracking-tighter text-muted">Workers</p>
        <div className="flex gap-2">
          {frame.workers.map((worker, i) => (
            <div key={i} className={["flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[0.75rem] font-bold transition-colors duration-300", WORKER[worker]].join(" ")}>
              worker-{i + 1}
              {worker === "busy" && frame.steps[2] === "active" && <span className="h-2 w-2 animate-pulse bg-accent-fg" aria-label="heartbeat" />}
            </div>
          ))}
        </div>
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="cases.py · ProvisionTenant" highlightLines={frame.lines} />
      <Provisioning frame={frame} />
    </div>
  );
}

export function CaseTenantSlide() {
  return (
    <Slide title="A certificate wait survives a dead worker" kicker="Case study · tenant provisioning" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">18 A certificate wait survives a dead worker / 24:30–25:15 / 0:45</p>
        <p className="italic">Quick pass, about 45 seconds: the usual version in one sentence, point at the highlighted line, one honest cost.</p>
        <p>Fifth: provisioning a B2B tenant. Database, DNS, TLS certificate, seed data. The certificate alone can take forty minutes.</p>
        <p>The usual version is Terraform started from a web request, and orphaned databases nobody notices until the cloud bill arrives.</p>
        <p>The long wait is one activity. It polls, and calls activity.heartbeat on every loop. The workflow gives it an hour in total and a two-minute heartbeat timeout.</p>
        <p>worker-2 dies mid-poll. After two minutes with no heartbeat, Temporal knows, and retries the activity on another worker. The workflow code never sees any of it.</p>
        <p>If the certificate never issues, wrap these steps in the same undo list as the checkout: delete the DNS record, drop the database.</p>
        <p>Honest cost: the heartbeat timeout is a tradeoff. Short means faster recovery and more heartbeat traffic. If a restart shouldn't start from zero, pass progress in the heartbeat details.</p>
      </SpeakerNote>
    </Slide>
  );
}
