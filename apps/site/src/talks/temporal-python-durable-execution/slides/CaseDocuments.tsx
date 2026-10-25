import { CodeEditor, ScenePanel, Slide, SpeakerNote, Stat, useLoopFrames } from "@talks/slide-engine";
import { at, caseSnippet } from "../caseCode";

const CODE = `${caseSnippet("llm")}\n\n${caseSnippet("documents")}`;

type Tile = "idle" | "active" | "done" | "limited";

type Frame = {
  lines: number[];
  split: boolean;
  tiles: Tile[];
  calls: number;
  retries: number;
  summary: boolean;
  flashRetry?: boolean;
  status: string;
  ms?: number;
};

const pages = (state: (page: number) => Tile): Tile[] => Array.from({ length: 20 }, (_, i) => state(i + 1));
const GATHER = at(CODE, "for i in range", 5);

const FRAMES: Frame[] = [
  { lines: [], split: false, tiles: pages(() => "idle"), calls: 0, retries: 0, summary: false, status: "A user uploads report.pdf, 20 pages." },
  { lines: at(CODE, "split_pdf", 2, -1), split: true, tiles: pages(() => "idle"), calls: 0, retries: 0, summary: false, status: "split_pdf stores each page and returns 20 keys." },
  { lines: GATHER, split: true, tiles: pages((p) => (p <= 10 ? "active" : "idle")), calls: 10, retries: 0, summary: false, status: "Ten summarize_page calls run at once." },
  { lines: GATHER, split: true, tiles: pages((p) => (p === 7 ? "limited" : p <= 10 ? "done" : "idle")), calls: 10, retries: 0, summary: false, status: "Page 7 gets 429 Too Many Requests.", ms: 2400 },
  { lines: at(CODE, "retry_policy", 2), split: true, tiles: pages((p) => (p === 7 ? "active" : p <= 10 ? "done" : "idle")), calls: 11, retries: 1, summary: false, flashRetry: true, status: "Only page 7 retries, 5 seconds later. The other nine are already in history.", ms: 2600 },
  { lines: GATHER, split: true, tiles: pages((p) => (p <= 10 ? "done" : "active")), calls: 21, retries: 1, summary: false, status: "Then the next ten." },
  { lines: GATHER, split: true, tiles: pages(() => "done"), calls: 21, retries: 1, summary: false, status: "20 summaries for 21 model calls, not 40." },
  { lines: at(CODE, "combine_summaries", 2, -1), split: true, tiles: pages(() => "done"), calls: 22, retries: 1, summary: true, status: "combine_summaries writes the final summary." },
];

const TILE: Record<Tile, string> = {
  idle: "border-2 border-dashed border-muted/50 text-muted",
  active: "animate-pulse bg-accent text-accent-fg",
  done: "bg-fg text-bg",
  limited: "border-2 border-accent bg-accent/15 text-fg",
};

function Pipeline({ frame }: { frame: Frame }) {
  return (
    <ScenePanel title="report.pdf" meta={frame.split ? "20 pages" : "uploading"} status={frame.status}>
      <div className="flex gap-2">
        <Stat label="Model calls" value={frame.calls} />
        <Stat label="Retries" value={frame.retries} accent={frame.flashRetry} />
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {frame.tiles.map((tile, i) => (
          <div
            key={i}
            className={[
              "flex aspect-[3/4] items-center justify-center font-mono text-[0.7rem] font-bold transition-all duration-500",
              frame.split ? "scale-100 opacity-100" : "scale-75 opacity-0",
              TILE[tile],
            ].join(" ")}
          >
            {tile === "limited" ? "429" : i + 1}
          </div>
        ))}
      </div>
      <div
        className={["flex flex-col gap-1 border-border bg-bg px-3 py-2 transition-all duration-500", frame.summary ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"].join(" ")}
        style={{ borderWidth: "var(--se-border-width)" }}
      >
        <p className="m-0 font-mono text-[0.8rem] font-bold">summary.md</p>
        <p className="m-0 text-[0.9rem] leading-snug">Three risks: auto-renewal, uncapped liability, 90-day notice.</p>
      </div>
    </ScenePanel>
  );
}

function Demo() {
  const { frame } = useLoopFrames(FRAMES);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <CodeEditor code={CODE} language="python" editable={false} size="sm" filename="cases.py · SummarizeDocument" highlightLines={frame.lines} />
      <Pipeline frame={frame} />
    </div>
  );
}

export function CaseDocumentsSlide() {
  return (
    <Slide title="A rate limit on page 7 retries page 7" kicker="Case study · LLM document pipeline" layout="wide">
      <Demo />
      <SpeakerNote>
        <p className="font-bold">16 A rate limit on page 7 retries page 7 / 23:00–23:45 / 0:45</p>
        <p className="italic">Quick pass, about 45 seconds: the usual version in one sentence, point at the highlighted line, one honest cost.</p>
        <p>Third: an LLM pipeline over uploaded documents. The model API rate-limits you, a big PDF takes twenty minutes, and the user has closed the tab.</p>
        <p>The usual version is one Celery task. A 429 on page 212 restarts it, and you pay for pages 1 to 211 again.</p>
        <p>Here every page is its own activity. asyncio.gather fans out ten at a time; the SDK's event loop handles that.</p>
        <p>Page 7 gets a 429. The retry policy retries only that activity, five seconds later. The other nine results are already in history, so nobody pays for them twice. The test file checks exactly that: page 7 runs twice, every other page once.</p>
        <p>Honest cost: every summary is written into history, so keep them short or return storage keys. If the API sends Retry-After, raise ApplicationError with next_retry_delay to wait exactly that long.</p>
      </SpeakerNote>
    </Slide>
  );
}
