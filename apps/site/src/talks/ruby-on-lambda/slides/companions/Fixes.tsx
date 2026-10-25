import { C, Database, Text, col, colSpan, ease, hash, phase } from "./shared";

// Four small multiples, one per trick Rails uses on a long-running server. Each runs the same
// tiny loop twice: once on a server that stays up, once on Lambda copies that come and go.
// Each column keeps 12 px clear of the divider on its right, so nothing touches a rule.
const W = colSpan(3) - 12;
// One vertical rhythm for every column: header, then two equal bands (server, Lambda), each a
// label, a 100 px panel and a two-line verdict, with a rule only between the bands.
const PANEL_H = 90;
const SERVER_Y = 132;
const LAMBDA_Y = 322;
const BAND_RULE = 284;
const VERDICT = (y: number) => y + PANEL_H + 24;

type Panel = { x: number; y: number; t: number; lambda: boolean };

const FIXES: { name: string; code?: boolean; what: string; server: string[]; lambda: string[]; Mini: (p: Panel) => JSX.Element }[] = [
  {
    name: "YJIT", what: "compiles hot methods to machine code", Mini: Jit,
    server: ["Every hot method compiles", "once, and stays compiled."],
    lambda: ["Few methods ever compile", "before the copy is reclaimed."],
  },
  {
    name: "Bootsnap", what: "caches compiled Ruby and load paths", Mini: Cache,
    server: ["The second boot is fast", "it reads tmp/cache."],
    lambda: ["Every boot is the first", "each copy starts with an empty /tmp."],
  },
  {
    name: "Connection pool", what: "keeps database connections open", Mini: Pool,
    server: ["Five connections, shared", "by every request."],
    lambda: ["One connection per copy", "a burst can run Postgres out."],
  },
  {
    name: "preload_app!", code: true, what: "boots once, then forks workers", Mini: Fork,
    server: ["Boot once, fork three", "workers share the memory."],
    lambda: ["Every copy boots alone", "and holds its own memory."],
  },
];

export function Fixes({ t, enter, fold }: { t: number; enter: number; fold: number }) {
  return (
    <g>
      {FIXES.map((f, i) => {
        const x = col(i * 3);
        const p = Math.min(fold, ease(phase(enter, 0.3 + i * 0.1, 0.9 + i * 0.1)));
        return (
          <g key={f.name} opacity={p} transform={`translate(0 ${(1 - p) * 18})`}>
            {i > 0 && <line x1={x - 12} x2={x - 12} y1={16} y2={VERDICT(LAMBDA_Y) + 24} stroke={C.border} />}
            <Text x={x} y={42} size={26} weight={300} color={C.fg} mono={f.code}>{f.name}</Text>
            <Text x={x} y={68} size={13.5}>{f.what}</Text>
            <line x1={x} x2={x + W} y1={88} y2={88} stroke={C.border} />

            <Band x={x} y={SERVER_Y} label="On a server" color={C.accent} />
            <f.Mini x={x} y={SERVER_Y} t={t} lambda={false} />
            {f.server.map((s, k) => <Text key={k} x={x} y={VERDICT(SERVER_Y) + k * 19} size={14.5} color={k ? C.muted : C.fg}>{s}</Text>)}

            <line x1={x} x2={x + W} y1={BAND_RULE} y2={BAND_RULE} stroke={C.border} />
            <Band x={x} y={LAMBDA_Y} label="On Lambda" color={C.coral} />
            <f.Mini x={x} y={LAMBDA_Y} t={t} lambda />
            {f.lambda.map((s, k) => <Text key={k} x={x} y={VERDICT(LAMBDA_Y) + k * 19} size={14.5} color={k ? C.muted : C.fg}>{s}</Text>)}
          </g>
        );
      })}
    </g>
  );
}

function Band({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y - 22} width={8} height={8} fill={color} />
      <text x={x + 16} y={y - 14} fontSize={11} fill={color} letterSpacing="0.08em">{label.toUpperCase()}</text>
    </g>
  );
}

/* YJIT: call counts climb toward the compile threshold. The server keeps counting; a copy is reclaimed every 1.5 s. */
const LIFE = 1.5;
function Jit({ x, y, t, lambda }: Panel) {
  const n = 10;
  const gap = 8;
  const bw = (W - gap * (n - 1)) / n;
  const top = y + 30;
  const life = lambda ? t % LIFE : t;
  let compiled = 0;
  const bars = Array.from({ length: n }, (_, i) => {
    const count = life * (0.35 + hash(i + 3)) * 0.5;
    if (count >= 1) compiled++;
    return Math.min(1, count);
  });
  const fresh = lambda ? 1 - phase(life, 0, 0.35) : 0;
  return (
    <g>
      <Text x={x} y={y + 12} size={12}>{`${compiled} of ${n} compiled`}</Text>
      {lambda && <Text x={x + W} y={y + 12} anchor="end" size={12} color={fresh > 0 ? C.coral : C.muted}>{`copy ${Math.floor(t / LIFE) + 1}`}</Text>}
      <line x1={x} x2={x + W} y1={top} y2={top} stroke={C.fg} strokeOpacity={0.35} strokeDasharray="2 4" />
      {bars.map((v, i) => {
        const h = v * (y + PANEL_H - top);
        return (
          <rect key={i} x={x + i * (bw + gap)} y={y + PANEL_H - h} width={bw} height={h}
            fill={v >= 1 ? C.accent : C.fg} opacity={v >= 1 ? 0.9 : 0.22} />
        );
      })}
      <line x1={x} x2={x + W} y1={y + PANEL_H} y2={y + PANEL_H} stroke={C.border} />
    </g>
  );
}

/* Bootsnap: 32 required files and the cache they write. */
function Cache({ x, y, t, lambda }: Panel) {
  const files = 32;
  const P = lambda ? 3 : 6;
  const tt = t % P;
  // Server: slow first boot, restart, fast second boot. Lambda: slow boot, then the copy and its /tmp vanish.
  const boot1 = phase(tt, 0.1, 2.3);
  const cleared = lambda ? phase(tt, 2.5, 2.8) : phase(tt, 2.6, 2.9) * (1 - phase(tt, 3.0, 3.01));
  const boot2 = lambda ? 0 : phase(tt, 3.1, 3.6);
  const done = !lambda && tt >= 3.0 ? boot2 : boot1 * (1 - cleared);
  const fast = !lambda && tt >= 3.0;
  const cacheFill = lambda ? boot1 * (1 - cleared) : Math.min(1, boot1 + (tt >= 3.0 ? 1 : 0)) * (1 - phase(tt, 5.6, 6));
  const status = lambda
    ? tt < 2.4 ? "new copy: compile, write cache" : "copy gone, /tmp with it"
    : tt < 2.4 ? "first boot: compile, write cache" : tt < 3.0 ? "restart" : "second boot: read cache";
  return (
    <g>
      <Text x={x} y={y + 12} size={12} color={tt >= 2.4 && tt < 3.0 ? C.fg : C.muted}>{status}</Text>
      {Array.from({ length: files }, (_, i) => {
        const on = i < Math.floor(done * files);
        return <rect key={i} x={x + (i % 8) * 15} y={y + 30 + Math.floor(i / 8) * 15} width={12} height={12}
          fill={on ? (fast ? C.accent : C.coral) : "none"} stroke={on ? "none" : C.border} opacity={on ? 0.85 : 1} />;
      })}
      <rect x={x + 160} y={y + 30} width={W - 160} height={57} fill="none" stroke={C.border} />
      <rect x={x + 160} y={y + 30 + 57 * (1 - cacheFill)} width={W - 160} height={57 * cacheFill} fill={C.lavender} opacity={0.35} />
      <Text x={x + 170} y={y + 50} size={12} color={C.fg} mono>{lambda ? "/tmp" : "tmp/cache"}</Text>
      <line x1={x} x2={x + W} y1={y + PANEL_H} y2={y + PANEL_H} stroke={C.border} />
    </g>
  );
}

/* Connection pool: lines from processes into the database, and its count. */
function Pool({ x, y, t, lambda }: Panel) {
  const db = { x: x + W - 86, y: y + 22, w: 86, h: 66 };
  const tt = t % 6;
  const copies = lambda ? Math.floor(ease(phase(tt, 0.2, 4.6)) * 12) : 1;
  const open = lambda ? copies : 5;
  const strain = lambda ? phase(copies, 6, 12) : 0;
  const lines = [];
  if (!lambda) {
    for (let k = 0; k < 5; k++) {
      const busy = hash(k * 13 + Math.floor(t * 3)) > 0.45;
      lines.push(<line key={k} x1={x + 70} y1={y + 40 + k * 7} x2={db.x} y2={db.y + 26 + k * 8} stroke={C.accent} strokeOpacity={busy ? 0.9 : 0.3} />);
    }
  }
  const boxes = Array.from({ length: lambda ? copies : 0 }, (_, i) => ({ bx: x + (i % 4) * 24, by: y + 24 + Math.floor(i / 4) * 24 }));
  return (
    <g opacity={1 - phase(tt, 5.6, 6) * (lambda ? 1 : 0)}>
      {!lambda && (
        <g>
          <rect x={x} y={y + 30} width={70} height={46} fill={C.surface} stroke={C.accent} />
          <Text x={x + 10} y={y + 58} size={13} color={C.fg}>Puma</Text>
        </g>
      )}
      {lines}
      {boxes.map((bx, i) => (
        <g key={i}>
          <line x1={bx.bx + 16} y1={bx.by + 8} x2={db.x} y2={db.y + 26 + (i % 6) * 6} stroke={C.coral} strokeOpacity={0.45} />
          <rect x={bx.bx} y={bx.by} width={16} height={16} fill={C.surface} stroke={C.coral} />
        </g>
      ))}
      <Database {...db} label="Postgres" color={strain > 0.5 ? C.coral : C.fg} glow={strain} />
      <Text x={x + W} y={y + 12} anchor="end" size={12} color={strain > 0.5 ? C.coral : C.muted}>{`${open} connections open`}</Text>
      <line x1={x} x2={x + W} y1={y + PANEL_H} y2={y + PANEL_H} stroke={C.border} />
    </g>
  );
}

/* preload_app! and fork: memory bars. Shared pages are drawn as outline, private memory as fill. */
function Fork({ x, y, t, lambda }: Panel) {
  const tt = t % 6;
  const bw = W - 64;
  const reset = 1 - phase(tt, 5.6, 6);
  const rows = [];
  if (!lambda) {
    const boot = phase(tt, 0.1, 1.6);
    rows.push({ label: "master", boot, mem: 1, shared: false, on: 1 });
    for (let k = 0; k < 3; k++) rows.push({ label: `worker ${k + 1}`, boot: 1, mem: 0.14, shared: true, on: phase(tt, 1.8 + k * 0.3, 2.0 + k * 0.3) });
  } else {
    for (let k = 0; k < 4; k++) {
      const start = 0.1 + k * 0.5;
      rows.push({ label: `copy ${k + 1}`, boot: phase(tt, start, start + 1.5), mem: 1, shared: false, on: phase(tt, start, start + 0.15) });
    }
  }
  const boots = lambda ? rows.filter((r) => r.on > 0).length : 1;
  return (
    <g opacity={reset}>
      <Text x={x + W} y={y + 12} anchor="end" size={12} color={lambda && boots > 1 ? C.coral : C.muted}>{`${boots} ${boots === 1 ? "boot" : "boots"}`}</Text>
      {rows.map((r, i) => {
        const ry = y + 22 + i * 17;
        const booting = r.boot < 1;
        return (
          <g key={r.label} opacity={r.on}>
            <Text x={x} y={ry + 11} size={12}>{r.label}</Text>
            {r.shared && <rect x={x + 64} y={ry} width={bw} height={13} fill="none" stroke={C.accent} strokeOpacity={0.6} strokeDasharray="3 3" />}
            <rect x={x + 64} y={ry} width={bw * r.mem * (booting ? r.boot : 1)} height={13} fill={booting ? C.coral : C.accent} opacity={booting ? 0.85 : 0.7} />
          </g>
        );
      })}
      <line x1={x} x2={x + W} y1={y + PANEL_H} y2={y + PANEL_H} stroke={C.border} />
    </g>
  );
}
