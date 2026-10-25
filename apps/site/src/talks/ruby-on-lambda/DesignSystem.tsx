import type { ReactNode } from "react";
import { DesignSection, DesignSpecimen, ThreadField, useSceneClock } from "@talks/slide-engine";
import { Boundary, Bucket, C, Chip, CoreGrid, Database, Defs, LambdaBox, Packet, Text, Wire, phase, type Pt } from "./slides/companions/shared";

const f = (token: string, mono = false) => `var(--se-${token}) var(${mono ? "--font-mono" : "--font-sans"})`;
const tight = "var(--se-tracking-tight)";
const snug = "var(--se-tracking-snug)";
const TYPE = [
  { role: "Display", selector: ".ruby-slide-01 h2", spec: "text-display · 80/0.95 · 300", sample: "Running Ruby apps on AWS Lambda", style: { font: f("text-display"), letterSpacing: tight } },
  { role: "Slide title", selector: ".ruby-words h2", spec: "text-h1 · 56/1 · 300", sample: "HTTP behavior belongs together", style: { font: f("text-h1"), letterSpacing: tight } },
  { role: "Section title", selector: ".ruby-companions h2", spec: "text-h2 · 40/1.05 · 300", sample: "Ruby on Lambda fits beside the product", style: { font: f("text-h2"), letterSpacing: tight } },
  { role: "Example", selector: ".ruby-companions-cap h3", spec: "text-lead · 24/1.25", sample: "Alert agent", style: { font: f("text-lead"), letterSpacing: snug } },
  { role: "Body", selector: ".ruby-subtitle, caption claim", spec: "text-body · 20/1.4", sample: "Native libraries do the pixels. Ruby is the glue.", style: { font: f("text-body"), letterSpacing: snug } },
  { role: "Small", selector: "story, cost, reveal cue", spec: "text-small · 15/1.45", sample: "Three couriers post delivery updates.", style: { font: f("text-small"), color: C.muted } },
  { role: "UI", selector: ".ruby-tabs button", spec: "text-ui · 14 · 500", sample: "The whole app", style: { font: f("text-ui") } },
  { role: "Label", selector: ".ruby-meta, footnotes, caption labels", spec: "text-label · 13", sample: "* Lambda always-free tier: 1M requests a month.", style: { font: f("text-label"), color: C.muted } },
  { role: "Code", selector: ".ruby-mono (Pragmasevka)", spec: "code only: Ruby, SQL, paths, commands", sample: 'DB[:orders].where(id: 8812) · s3://reports/', style: { fontSize: 15 }, mono: true },
];

const ROLES = [
  { color: C.accent, token: "--color-accent", role: "Ruby, live work, healthy" },
  { color: C.coral, token: "--se-diagram-coral", role: "Alerts, limits, cost" },
  { color: C.cyan, token: "--se-diagram-cyan", role: "Network, VPC, data out" },
  { color: C.lavender, token: "--se-diagram-lavender", role: "Agents, ML, models" },
  { color: C.amber, token: "--se-diagram-amber", role: "Load, cold start, attention" },
];

function Art({ w = 300, h = 160, children }: { w?: number; h?: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img">
      <Defs />
      {children}
    </svg>
  );
}

const WIRE: Pt[] = [[20, 80], [140, 80], [160, 40], [280, 40]];

export function DesignSystem() {
  const t = useSceneClock();
  const loop = (period: number) => (t % period) / period;
  return (
    <>
      <DesignSection title="Type scale" note="Geist for every word on the slide: 300 headlines, 400 text, 500 controls. Pragmasevka only for code. Never mono for captions or numbers.">
        <div className="ruby-ds-type">
          {TYPE.map((row) => (
            <div key={row.role}>
              <div>
                <strong>{row.role}</strong>
                <code>{row.selector}</code>
                <code>{row.spec}</code>
              </div>
              <p className={row.mono ? "ruby-mono" : undefined} style={row.style}>{row.sample}</p>
            </div>
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Color roles" note="Each diagram color means one thing across the deck. Don't reuse coral for decoration.">
        <div className="ruby-ds-roles">
          {ROLES.map((r) => (
            <div key={r.token}>
              <span style={{ background: r.color }} />
              <strong>{r.role}</strong>
              <code>{r.token}</code>
            </div>
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Slide chrome" note="HTML pieces that frame every slide.">
        <div className="se-ds-specimens">
          <DesignSpecimen name="Meta row" rule="Top of every slide. Speaker and event left, date right." wide>
            <div className="ruby-meta" style={{ width: "100%" }}><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
          </DesignSpecimen>
          <DesignSpecimen name="Step tabs" rule="Jump between steps. Active step is a solid accent block." wide>
            <nav className="ruby-tabs" aria-label="Specimen">
              {["Images", "Ingestion", "Alert agent", "The whole app"].map((tab, i) => (
                <button key={tab} type="button" aria-pressed={i === 0} tabIndex={-1}><span>{`0${i + 1}`}</span>{tab}</button>
              ))}
            </nav>
          </DesignSpecimen>
          <DesignSpecimen name="Claim + cost" rule="One claim, one honest constraint. Never more than two sentences.">
            <div className="ruby-companions-cap" style={{ animation: "none" }}>
              <h3>Images</h3>
              <p>Native libraries do the pixels. Ruby is the glue.</p>
              <p className="ruby-companions-cost">Native gems must be built for Lambda's Linux.</p>
            </div>
          </DesignSpecimen>
          <DesignSpecimen name="Reveal buttons" rule="LayeredDiagram steps on slides 3–24.">
            <figure className="se-layered-diagram" style={{ width: "100%" }}>
              <figcaption>
                <span>A small Ruby app</span>
                <div>
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" aria-pressed={n === 2} tabIndex={-1}>{`0${n}`}</button>
                  ))}
                </div>
              </figcaption>
            </figure>
          </DesignSpecimen>
        </div>
      </DesignSection>

      <DesignSection title="Diagram parts" note="SVG primitives from slides/companions/shared.tsx. Square corners, 1px strokes, mono labels.">
        <div className="se-ds-specimens">
          <DesignSpecimen name="LambdaBox" rule="One execution environment. Border traces in on cold start.">
            <Art><LambdaBox x={40} y={20} w={220} h={110} title="worker.rb" draw={Math.min(1, loop(3) * 2)} /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="CoreGrid" rule="The product that already runs. Flicker is live traffic.">
            <Art><CoreGrid x={60} y={14} cols={14} rows={7} t={t} cell={9} sub="main repo · Puma" /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="Packet + Wire" rule="One request. Square head, short trail, glow.">
            <Art><Wire pts={WIRE} /><Packet pts={WIRE} p={loop(2)} /><Packet pts={WIRE} p={loop(2.6)} color={C.coral} /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="Chip" rule="An endpoint or a native library. Dims when idle.">
            <Art><Chip x={30} y={40} w={120} label="POST /alert" color={C.coral} active={loop(2) < 0.5 ? 1 : 0} /><Chip x={170} y={40} w={110} label="libvips · C" color={C.cyan} active={loop(2) >= 0.5 ? 1 : 0} /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="Bucket" rule="Object storage. One stripe per stored result.">
            <Art><Bucket x={110} y={10} w={90} h={110} count={3 + Math.floor(t % 8)} flash={1 - phase(t % 1, 0, 0.8)} label="s3://reports/" /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="Database" rule="SQL as a table, not a cylinder. Coral when it refuses connections.">
            <Art><Database x={90} y={14} w={130} h={104} label="Postgres" color={loop(4) > 0.5 ? C.coral : C.fg} glow={loop(4) > 0.5 ? 1 : 0} /></Art>
          </DesignSpecimen>
          <DesignSpecimen name="Boundary" rule="A repository or a VPC. Dashed, labelled top-left.">
            <Art><Boundary x={30} y={34} w={240} h={100} label="alerts-agent/ — separate repo" /><Text x={150} y={90} anchor="middle" size={11} mono>ships together</Text></Art>
          </DesignSpecimen>
          <DesignSpecimen name="ThreadField" rule="Title-slide motion. Many sources, one waist, many results." wide>
            <div style={{ width: "100%", height: 220 }}><ThreadField threads={500} pulses={40} /></div>
          </DesignSpecimen>
        </div>
      </DesignSection>
    </>
  );
}
