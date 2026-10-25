import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, Tag, useLoopFrames } from "@talks/slide-engine";
import { at, caseSnippet } from "../caseCode";

const CODE = caseSnippet("sync");
const TOTAL_PAGES = 249;

type Frame = {
  lines: number[];
  page: number;
  synced: number;
  cursor: string;
  run: 1 | 2;
  deploy: boolean;
  resumed: boolean;
  status: string;
  ms?: number;
};

const FRAMES: Frame[] = [
  { lines: [], page: 0, synced: 0, cursor: "None", run: 1, deploy: false, resumed: false, status: "The hourly schedule starts CrmSync for Acme." },
  { lines: at(CODE, "fetch_and_upsert_page,", 3, -1), page: 1, synced: 100, cursor: '"c1"', run: 1, deploy: false, resumed: false, status: "Fetch a page and upsert it, in one activity." },
  { lines: [...at(CODE, "synced += page.count"), ...at(CODE, "cursor = page.next_cursor")], page: 42, synced: 4_200, cursor: '"c42"', run: 1, deploy: false, resumed: false, status: "The cursor is a local variable, so it's rebuilt from history." },
  { lines: [], page: 42, synced: 4_200, cursor: '"c42"', run: 1, deploy: true, resumed: false, status: "Deploy. Every worker restarts in the middle of the sync.", ms: 2600 },
  { lines: at(CODE, "cursor, synced = ", 2), page: 43, synced: 4_300, cursor: '"c43"', run: 1, deploy: false, resumed: true, status: 'Replay rebuilds cursor = "c42". The next page is 43, not 1.', ms: 2600 },
  { lines: at(CODE, "continue_as_new", 2), page: 200, synced: 20_000, cursor: '"c200"', run: 2, deploy: false, resumed: true, status: "After 200 pages, continue as new with the cursor. Fresh history." },
  { lines: at(CODE, "page.next_cursor is None", 2), page: TOTAL_PAGES, synced: 24_900, cursor: "None", run: 2, deploy: false, resumed: true, status: "The last page has no cursor. 24,900 contacts. Next run in an hour." },
];

function Sync({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="HubSpot → Postgres" meta="acme · hourly" status={frame.status}>
      <div className="relative flex flex-col gap-3">
        <div
          className={[
            "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-fg text-[clamp(1.1rem,2cqw,1.4rem)] font-bold tracking-tighter text-bg transition-opacity duration-500",
            frame.deploy ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden={!frame.deploy}
        >
          deploy · every worker restarts
        </div>
        <div className="flex items-stretch gap-2">
          <Stat label="HubSpot contacts" value="24,900" />
          <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1">
            <span className="text-[0.75rem] font-bold tracking-tighter text-muted">page</span>
            <span className="bg-accent px-2 py-0.5 font-mono text-[0.9rem] font-bold text-accent-fg tabular-nums">{frame.page}</span>
          </div>
          <Stat label="Synced to Postgres" value={frame.synced.toLocaleString("en-US")} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[0.8rem] font-bold tracking-tighter">
            <span>Pages</span>
            <span className="font-mono">{frame.page} / {TOTAL_PAGES}</span>
          </div>
          <div className="h-3 w-full bg-fg/10">
            <div className="h-3 bg-accent transition-[width] duration-700" style={{ width: `${(frame.page / TOTAL_PAGES) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag>cursor = {frame.cursor}</Tag>
          <Tag accent={frame.run === 2}>{frame.run === 2 ? "run 2 · continue-as-new" : "run 1"}</Tag>
          <Tag accent className={["transition-opacity duration-500", frame.resumed ? "opacity-100" : "opacity-0"].join(" ")}>
            resumed at page 43
          </Tag>
        </div>
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="cases.py · CrmSync" highlightLines={frame.lines} />
      <Sync frame={frame} />
    </div>
  );
}

export function CaseSyncSlide() {
  return (
    <Slide title="A deploy mid-sync resumes at page 43" kicker="Case study · third-party sync" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">19 A deploy mid-sync resumes at page 43 / 25:15–26:00 / 0:45</p>
        <p className="italic">Quick pass, about 45 seconds: the usual version in one sentence, point at the highlighted line, one honest cost.</p>
        <p>Last one: syncing from a third-party API. Import every contact from a customer's CRM, 100 per page, rate-limited. It takes hours, and then it has to stay in sync.</p>
        <p>The usual version is a long job that restarts from page 1 after every deploy, and a sync_cursor column that sometimes moves before the page is saved.</p>
        <p>Here the cursor is a local variable. Fetch and upsert are one activity, so a page is saved before the cursor moves.</p>
        <p>We deploy in the middle. Every worker restarts. Replay rebuilds the cursor from history, and the next request is page 43.</p>
        <p>After 200 pages we continue as new: fresh history, same workflow ID, carrying the cursor. A Temporal Schedule starts this every hour and can skip a run while the last one is still going.</p>
        <p>Honest cost: enforce the API's rate limit across all customers with a dedicated task queue and a per-second activity limit on its workers.</p>
        <p>Transition: six systems, one shape, plain Python. That's the pitch. So what's the catch?</p>
      </SpeakerNote>
    </Slide>
  );
}
