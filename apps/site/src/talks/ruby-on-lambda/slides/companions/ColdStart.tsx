import { C, Scene, Text, ease, hash, phase } from "./shared";

// Where the first request's time goes, phase by phase. Illustrative split for a mid-size Rails app (see the footnote).
type Block = { label: string; from: number; to: number; code?: boolean; files?: boolean };
type Row = { label: string; color: string; step: number; blocks: Block[] };
const ROWS: Row[] = [
  { label: "Firecracker micro VM", color: C.lavender, step: 0, blocks: [{ label: "", from: 0, to: 90 }] },
  { label: "fetch image and layers", color: C.lavender, step: 0, blocks: [{ label: "", from: 90, to: 330 }] },
  { label: "runtime bootstrap", color: C.lavender, step: 0, blocks: [{ label: "aws_lambda_ric", from: 330, to: 420, code: true }] },
  { label: "Ruby VM, RubyGems", color: C.cyan, step: 0, blocks: [{ label: "", from: 420, to: 520 }] },
  { label: "Bundler.setup", color: C.amber, step: 1, blocks: [{ label: "Gemfile.lock → $LOAD_PATH", from: 520, to: 600, code: true }] },
  {
    label: "require gems", color: C.amber, step: 1, blocks: [
      { label: "activesupport", from: 600, to: 760, code: true, files: true },
      { label: "activerecord", from: 760, to: 930, code: true, files: true },
      { label: "actionpack", from: 930, to: 1050, code: true, files: true },
      { label: "actionview", from: 1050, to: 1130, code: true, files: true },
      { label: "aws-sdk-core", from: 1130, to: 1270, code: true, files: true },
      { label: "nokogiri", from: 1270, to: 1320, code: true, files: true },
      { label: "pg", from: 1320, to: 1350, code: true, files: true },
    ],
  },
  {
    label: "run initializers", color: C.coral, step: 2, blocks: [
      { label: "config/application.rb", from: 1350, to: 1420, code: true },
      { label: "i18n: load locale files", from: 1420, to: 1490 },
      { label: "active_record.*", from: 1490, to: 1610, code: true },
      { label: "action_dispatch.*", from: 1610, to: 1700, code: true },
      { label: "config/initializers/*", from: 1700, to: 1850, code: true },
    ],
  },
  {
    label: "Zeitwerk eager load", color: C.coral, step: 2, blocks: [
      { label: "app/models", from: 1850, to: 2010, code: true, files: true },
      { label: "app/controllers", from: 2010, to: 2130, code: true, files: true },
      { label: "app/jobs, mailers", from: 2130, to: 2210, code: true, files: true },
      { label: "lib", from: 2210, to: 2350, code: true, files: true },
    ],
  },
  { label: "routes, middleware stack", color: C.coral, step: 2, blocks: [{ label: "", from: 2350, to: 2450 }] },
  { label: "lamby: event → Rack env", color: C.accent, step: 3, blocks: [{ label: "", from: 2450, to: 2470 }] },
  { label: "connect, load schema cache", color: C.cyan, step: 3, blocks: [{ label: "PG.connect, columns", from: 2470, to: 2650 }] },
  { label: "compile view templates", color: C.lavender, step: 3, blocks: [{ label: "ERB → Ruby → bytecode", from: 2650, to: 2780 }] },
  { label: "your code", color: C.accent, step: 3, blocks: [{ label: "", from: 2780, to: 2810 }] },
];
const SWEEP = [{ from: 0, to: 520, dur: 1.4 }, { from: 520, to: 1350, dur: 2.4 }, { from: 1350, to: 2450, dur: 2.6 }, { from: 2450, to: 2810, dur: 1.6 }];

// Running totals that make the work countable. Rough, illustrative magnitudes.
const KPIS = [
  { label: "files required", at: [[520, 0], [1350, 2400], [1850, 2400], [2350, 3300]] },
  { label: "constants defined", at: [[520, 0], [1350, 5200], [1850, 5600], [2350, 9100]] },
  { label: "initializers run", at: [[1350, 0], [1850, 140]] },
  { label: "DB connections", at: [[2470, 0], [2650, 1]] },
] as const;
const interp = (pts: readonly (readonly [number, number])[], ms: number) => {
  if (ms <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [a, va] = pts[i - 1]!;
    const [b, vb] = pts[i]!;
    if (ms <= b) return va + (vb - va) * ((ms - a) / (b - a));
  }
  return pts[pts.length - 1]![1];
};

const X0 = 214;
const X1 = 792;
const MAX = 2900;
const x = (ms: number) => X0 + (ms / MAX) * (X1 - X0);
const ROW0 = 58;
const PITCH = 27;
const BAR = 19;
const AXIS_Y = ROW0 + ROWS.length * PITCH + 2;

export function ColdStart({ step, since }: { t: number; step: number; since: number }) {
  const sweep = SWEEP[Math.min(step, SWEEP.length - 1)]!;
  const cursor = sweep.from + (sweep.to - sweep.from) * ease(phase(since, 0.1, 0.1 + sweep.dur));
  const done = step >= 3 ? phase(since, 1.8, 2.3) : 0;
  const now = ROWS.flatMap((r, i) => r.blocks.map((b) => ({ ...b, i }))).find((b) => cursor > b.from && cursor <= b.to && cursor < sweep.to);

  return (
    <Scene viewBox="0 0 800 520" label="A dense waterfall of a Rails cold start on Lambda: micro VM, image, runtime and Ruby; Bundler and every gem, one stripe per required file; Rails initializers, Zeitwerk eager load, routes; then lamby, the database connection and schema cache, template compilation, and finally a few milliseconds of your code. Counters show files required, constants defined, initializers run and connections opened.">
      <Text x={X0} y={16} size={13}>first request after a cold start</Text>
      <Text x={X1} y={22} anchor="end" size={26} color={C.fg} weight={300}>{`${Math.round(cursor).toLocaleString("en-US")} ms*`}</Text>

      {[0, 500, 1000, 1500, 2000, 2500].map((ms) => (
        <g key={ms}>
          <line x1={x(ms)} x2={x(ms)} y1={ROW0 - 10} y2={AXIS_Y} stroke={C.border} strokeOpacity={0.6} />
          <Text x={x(ms)} y={AXIS_Y + 15} anchor="middle" size={11}>{`${ms / 1000} s`}</Text>
        </g>
      ))}
      <line x1={X0} x2={X1} y1={AXIS_Y} y2={AXIS_Y} stroke={C.border} />

      {ROWS.map((row, i) => {
        const y = ROW0 + i * PITCH;
        const shown = step >= row.step;
        const active = step === row.step;
        return (
          <g key={row.label} opacity={shown ? 1 : 0.2} style={{ transition: "opacity .5s" }}>
            <rect x={0} y={y - 4} width={800} height={PITCH} fill={C.fg} opacity={now?.i === i ? 0.04 : 0} />
            <Text x={X0 - 12} y={y + BAR / 2 + 4} anchor="end" size={12.5} color={active ? C.fg : C.muted}>{row.label}</Text>
            {row.blocks.map((b, k) => {
              const end = Math.min(b.to, cursor);
              if (end <= b.from) return null;
              const w = Math.max(1.5, x(end) - x(b.from) - 1);
              // One stripe per required file: density is the point.
              const stripes = b.files ? Array.from({ length: Math.floor((x(b.to) - x(b.from)) / 2.2) }, (_, s) => x(b.from) + 1 + s * 2.2).filter((sx) => sx < x(end)) : [];
              return (
                <g key={k}>
                  <rect x={x(b.from)} y={y} width={w} height={BAR} fill={row.color} opacity={active ? 0.55 : 0.32} />
                  {stripes.map((sx, s) => (
                    <rect key={s} x={sx} y={y + 2 + hash(s + k * 50 + i * 7) * 5} width={1} height={BAR - 4 - hash(s * 3 + k) * 6} fill={C.bg} opacity={0.4} />
                  ))}
                  {k > 0 && <rect x={x(b.from) - 1} y={y} width={1.5} height={BAR} fill={C.bg} />}
                  {b.label && end >= b.to && x(b.to) - x(b.from) > b.label.length * 6.2 + 8 && (
                    <text x={x(b.from) + 4} y={y + BAR / 2 + 4} fontSize={11} fill={C.fg} stroke={C.bg} strokeWidth={3} paintOrder="stroke" className={b.code ? "ruby-mono" : undefined}>{b.label}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* What is loading right now, riding the cursor. */}
      {now?.label && (
        <g>
          <rect x={Math.min(x(cursor) + 6, X1 - 4 - now.label.length * 7.2)} y={ROW0 + now.i * PITCH - 15} width={now.label.length * 7.2 + 4} height={15} fill={C.bg} opacity={0.85} />
          <Text x={Math.min(x(cursor) + 8, X1 - 2 - now.label.length * 7.2)} y={ROW0 + now.i * PITCH - 4} size={12} color={C.fg} mono={now.code}>{now.label}</Text>
        </g>
      )}
      <line x1={x(cursor)} x2={x(cursor)} y1={ROW0 - 10} y2={AXIS_Y} stroke={C.fg} strokeOpacity={0.85} />

      {/* Cold start bracket, once your code has finally run. */}
      <g opacity={done}>
        <rect x={x(0)} y={ROW0 - 16} width={x(2780) - x(0)} height={4} fill={C.coral} />
        <Text x={x(0) + 200} y={16} size={13} color={C.coral}>all of this is the cold start</Text>
      </g>

      {/* Counters. */}
      {KPIS.map((k, i) => {
        const v = interp(k.at, cursor);
        const w = X1 / 5;
        const kx = i * w;
        return (
          <g key={k.label}>
            <line x1={kx} x2={kx + w - 16} y1={AXIS_Y + 34} y2={AXIS_Y + 34} stroke={C.border} />
            <Text x={kx} y={AXIS_Y + 66} size={26} weight={300} color={v > 0 ? C.fg : C.muted}>{`${v >= 1000 ? "≈" : ""}${Math.round(v).toLocaleString("en-US")}`}</Text>
            <Text x={kx} y={AXIS_Y + 84} size={12}>{k.label}</Text>
          </g>
        );
      })}
      <line x1={(X1 / 5) * 4} x2={X1} y1={AXIS_Y + 34} y2={AXIS_Y + 34} stroke={C.border} />
      <Text x={(X1 / 5) * 4} y={AXIS_Y + 66} size={26} weight={300} color={done > 0 ? C.accent : C.muted}>30 ms</Text>
      <Text x={(X1 / 5) * 4} y={AXIS_Y + 84} size={12}>next request, warm</Text>
    </Scene>
  );
}
