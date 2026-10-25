import { memo } from "react";
import { C, Chip, Scene, Text, hash, phase } from "./shared";

const COLS = 6;
const ROWS = 5;
const CELL = { w: 56, h: 40, gap: 10 };
const GRID = { x: 150, y: 60 };
const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  x: GRID.x + (i % COLS) * (CELL.w + CELL.gap),
  y: GRID.y + Math.floor(i / COLS) * (CELL.h + CELL.gap),
  rank: hash(i * 3.1),
  period: 2.4 + hash(i * 7.7) * 2.6,
  offset: hash(i + 11) * 5,
}));
const GRID_RIGHT = GRID.x + COLS * (CELL.w + CELL.gap) - CELL.gap;
const SERVICES = [
  { label: "a database", color: C.cyan },
  { label: "a queue", color: C.amber },
  { label: "a public URL", color: C.lavender },
];

/** Calls arriving in waves that rise to a crowd and fall to almost nothing. */
const load = (t: number) => 0.06 + 0.94 * Math.pow(Math.max(0, Math.sin((t * 2 * Math.PI) / 7)), 2);

// Swole Doge and Cheems as hand-drawn pixel art, proportioned from the meme.
// o: outline, A: fur, a: muscle lines, O: Cheems' orange, W: cream, K: eyes and nose.
const SMALL = [
  ".....o.....o........",
  "....oOo...oOo.......",
  "....oOOoooOOOo......",
  "...oOOOOOOOOOOo.....",
  "...oOKKOOOOKKOo.....",
  "..oWWKOOOOOOKOOo....",
  "..oWWWWOOOOOOOOo....",
  ".oKWWWWWOOOOOOOOo...",
  "..oWWaaWWOOOOOOOo...",
  "...ooWWWWWOOOOOOOo..",
  "....oWWWWWOOOOOOOOo.",
  "....oWWWWWWOOOOOOOo.",
  "...oWWWWWWWOOOOOOOOo",
  "...oWWoWWWWWOOOOOOOo",
  "...oWWoWWWWWWOOOOOOo",
  "...oWWoWWWWWWOOOOOOo",
  "..oWWWoWWWWWWOOOOOo.",
  ".oWWWo.oWWWWWOOOOOo.",
  ".ooooo..oooooooooo..",
];
const SWOLE = [
  "............o.....o.............",
  "...........oAo...oAo............",
  "...........oAAoooAAo............",
  "..........oAAAAAAAAAo...........",
  "..........oAWKAAAWKAo...........",
  "..........oAAAWWWWWWWo..........",
  "..........oAAWWWWWWWKo..........",
  "...........oAWWWaaWWo...........",
  "............oAAWWWAo............",
  "........ooooAAAAAAAAoooo........",
  ".....oooAAAAAAAAAAAAAAAAooo.....",
  "...ooAAAAAAAAAAAAAAAAAAAAAAoo...",
  "..oAAAAAaAAAAAAAAAAAAAAaAAAAAo..",
  ".oAAAAAAaAAWWWWWWWWWWAAaAAAAAAo.",
  ".oAAAAAAaAWWWWWWWWWWWWAaAAAAAAo.",
  "oAAAAAAAaAWWWWWWWWWWWWAaAAAAAAAo",
  "oAAAAAAaAAaaaaaaaaaaaaAAaAAAAAAo",
  "oAAAAAaoAAWWaWWaaWWaWWAAoaAAAAAo",
  "oAAAAAaoAAWWaWWaaWWaWWAAoaAAAAAo",
  "oAAAAAaooAaaaaaaaaaaaaAooaAAAAAo",
  "oAAAAAAo.oAWWaWaaWaWWAo.oAAAAAAo",
  "oAAAAAAo.oAWWaWaaWaWWAo.oAAAAAAo",
  ".oAAAAAo.oAaaaaaaaaaaAo.oAAAAAo.",
  ".oAAAAAo..oAWWaaaaWWAo..oAAAAAo.",
  ".oAAAAAo..oAAAAAAAAAAo..oAAAAAo.",
  "..oAAAAo..oAAAAAAAAAAo..oAAAAo..",
  "..oWWWWo...oAAAooAAAo...oWWWWo..",
  ".oWWWWWWo..oAAAooAAAo..oWWWWWWo.",
  ".oWoWoWo...oAAAooAAAo...oWoWoWo.",
  "...........oAAo..oAAo...........",
  "...........oAAo..oAAo...........",
  "..........oWWWo..oWWWo..........",
  "..........ooooo..ooooo..........",
];
const FILL: Record<string, string> = { o: C.amber, A: C.amber, a: C.amber, O: "color-mix(in srgb, var(--se-diagram-amber), var(--se-diagram-coral) 55%)", W: C.fg, K: C.bg };

// The pixels never change, only the group's transform does: render them once.
const Pixels = memo(function Pixels({ art, px }: { art: string[]; px: number }) {
  return (
    <>
      {art.flatMap((row, r) => [...row].map((ch, c) => ch === "." ? null : (
        <rect key={`${r}-${c}`} x={c * px} y={r * px} width={px} height={px} style={{ fill: FILL[ch] }} opacity={ch === "o" ? 0.3 : ch === "a" ? 0.8 : ch === "W" ? 0.9 : 1} />
      )))}
    </>
  );
});

function Dog({ art, x, y, px, t, label, sub, says, cpus }: { art: string[]; x: number; y: number; px: number; t: number; label: string; sub: string; says: string; cpus: number }) {
  const h = art.length * px;
  // The small one trembles; the large one breathes.
  const dx = cpus === 1 ? Math.sin(t * 40) * 0.8 : 0;
  const lift = cpus === 1 ? 0 : Math.sin(t * 2) * 2;
  return (
    <g>
      <Text x={x} y={y - h - 22} size={16} color={C.fg} opacity={0.9}>{says}</Text>
      <g transform={`translate(${x + dx} ${y - h + lift})`}>
        <Pixels art={art} px={px} />
      </g>
      {Array.from({ length: 6 }, (_, i) => {
        const on = i < cpus;
        const level = on ? (cpus === 1 ? 0.35 : 0.6 + 0.4 * Math.abs(Math.sin(t * 3 + i))) : 0;
        return (
          <g key={i}>
            <rect x={x + i * 22} y={y + 18} width={16} height={36} fill="none" stroke={C.border} />
            <rect x={x + i * 22} y={y + 54 - 36 * level} width={16} height={36 * level} fill={C.accent} opacity={0.85} />
          </g>
        );
      })}
      <Text x={x} y={y + 78} size={18} color={C.fg}>{label}</Text>
      <Text x={x} y={y + 100} size={14}>{sub}</Text>
    </g>
  );
}

/** One run: boot, work, done, all inside fifteen minutes. */
function Clock({ t }: { t: number }) {
  const p = (t % 6) / 6;
  const x0 = 150, x1 = 650, y = 488;
  const boot = 0.06;
  return (
    <g>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={C.border} strokeWidth={4} />
      <line x1={x0} x2={x0 + (x1 - x0) * Math.min(p, boot)} y1={y} y2={y} stroke={C.amber} strokeWidth={4} />
      <line x1={x0 + (x1 - x0) * boot} x2={x0 + (x1 - x0) * Math.max(boot, p)} y1={y} y2={y} stroke={C.accent} strokeWidth={4} />
      <line x1={x1} x2={x1} y1={y - 10} y2={y + 10} stroke={C.coral} />
      <Text x={x0} y={y - 14} size={14} color={C.amber}>boot</Text>
      <Text x={x0 + (x1 - x0) * 0.35} y={y - 14} size={14}>serve requests, crunch a job</Text>
      <Text x={x1} y={y - 14} size={14} anchor="end" color={C.coral}>15 minutes</Text>
    </g>
  );
}

export function Offer({ t, step }: { t: number; step: number }) {
  const now = load(t);
  const question = step >= 1; // the sizes step
  const dim = question ? 0 : 1;
  const history = Array.from({ length: 48 }, (_, k) => load(t - (47 - k) * 0.12));
  let alive = 0;

  const vms = SLOTS.map((s, i) => {
    const u = ((t + s.offset) / s.period) % 1;
    const on = s.rank < now && u < 0.72;
    if (!on) return <rect key={i} x={s.x} y={s.y} width={CELL.w} height={CELL.h} fill="none" stroke={C.border} strokeOpacity={0.5} />;
    alive++;
    const draw = phase(u, 0.06, 0.14);
    const fade = 1 - phase(u, 0.62, 0.72);
    return (
      <g key={i} opacity={fade}>
        <rect x={s.x} y={s.y} width={CELL.w} height={CELL.h} fill={C.surface} stroke={C.accent} strokeWidth={1.2}
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <Text x={s.x + 8} y={s.y + 18} size={13} color={C.accent} opacity={draw}>λ</Text>
        <rect x={s.x + 8} y={s.y + CELL.h - 10} width={(CELL.w - 16) * phase(u, 0.05, 0.62)} height={2} fill={C.accent} opacity={0.8} />
      </g>
    );
  });

  return (
    <Scene viewBox="0 0 800 520" label="Calls arrive and tiny computers start for each one, then vanish; with no calls there is nothing running and nothing to pay. A database, a queue and a URL sit next to them.">
      <g style={{ opacity: dim, visibility: question ? "hidden" : "visible", transition: question ? "opacity .8s, visibility 0s .8s" : "opacity .8s" }}>
        {vms}
        <Text x={GRID.x} y={GRID.y - 18} size={14} color={C.fg}>{`${alive} running`}</Text>
        <Text x={GRID_RIGHT} y={GRID.y - 18} size={14} anchor="end">gone when the work is done</Text>

        <g>
          {history.map((v, k) => (
            <rect key={k} x={GRID.x + k * 8.25} y={470 - v * 60} width={5} height={Math.max(1, v * 60)} fill={C.amber} opacity={0.25 + (k / 48) * 0.6} />
          ))}
          <Text x={GRID.x} y={496} size={13}>calls</Text>
          <Text x={620} y={432} size={14}>your bill</Text>
          <Text x={620} y={486} size={52} color={C.accent} weight={300}>$0*</Text>
        </g>

        <g>
          {SERVICES.map((svc, k) => {
            const y = 90 + k * 90;
            return (
              <g key={svc.label}>
                <Chip x={620} y={y} w={170} label={svc.label} color={svc.color} />
                <Text x={705} y={y + 54} anchor="middle" size={12}>free too*</Text>
              </g>
            );
          })}
        </g>
      </g>

      <g style={{ opacity: question ? 1 : 0, transition: "opacity .8s" }}>
        <Dog art={SMALL} x={150} y={330} px={6} t={t} says="“i serve simple requests”" label="small function" sub="a slice of one CPU" cpus={1} />
        <Dog art={SWOLE} x={390} y={330} px={8} t={t} says="“I run AI agents inside”" label="large function" sub="six CPUs, 10 GB*" cpus={6} />
        <Clock t={t} />
      </g>
    </Scene>
  );
}
