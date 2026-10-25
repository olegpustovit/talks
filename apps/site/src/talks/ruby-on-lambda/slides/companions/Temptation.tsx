import { C, Database, Scene, Text, clamp01, lerp, phase } from "./shared";

// One loop, about ten seconds: the Rails app gathers itself, leaves the box, lands in Lambda,
// scales out with traffic and back down to nothing, then the loop resets.
const P = 9.6;

// Motion curves. Anticipation and overshoot come from these, not from extra props.
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outBack = (p: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const inBack = (p: number) => { const c = 1.4; return (c + 1) * p * p * p - c * p * p; };

// The app as a treemap, in its own units.
const PARTS = [
  { label: "models", x: 0, y: 0, w: 112, h: 72, color: C.accent },
  { label: "controllers", x: 112, y: 0, w: 138, h: 72, color: C.accent },
  { label: "views", x: 0, y: 72, w: 84, h: 78, color: C.lavender },
  { label: "jobs", x: 84, y: 72, w: 62, h: 39, color: C.amber },
  { label: "mailers", x: 84, y: 111, w: 62, h: 39, color: C.amber },
  { label: "gems", x: 146, y: 72, w: 104, h: 78, color: C.cyan },
];
const BOX = { x: 40, y: 150, w: 290, h: 230 };
const HOME = { x: BOX.x + 20, y: BOX.y + 50 };

// Lambda copies: a 3×2 grid; copy 0 is where the app lands.
const K = 0.4;
const SLOT = { w: 250 * K + 16, h: 150 * K + 34 };
const SLOTS = Array.from({ length: 6 }, (_, i) => ({ x: 420 + (i % 3) * (SLOT.w + 14), y: 120 + Math.floor(i / 3) * (SLOT.h + 18) }));
const RDS = { x: 540, y: 400, w: 130, h: 78 };
const inner = (s: { x: number; y: number }) => ({ x: s.x + 8, y: s.y + 26 });

// When each copy exists: 0 → 1 while spawning, 1 → 0 while being reclaimed.
function presence(c: number, tt: number) {
  if (c === 0) return Math.min(phase(tt, 2.5, 3.0), 1 - phase(tt, 8.0, 8.45));
  const up = outBack(clamp01(phase(tt, 3.6 + (c - 1) * 0.32, 4.1 + (c - 1) * 0.32)));
  const down = 1 - inBack(clamp01(phase(tt, 6.5 + (5 - c) * 0.22, 6.9 + (5 - c) * 0.22)));
  return Math.max(0, Math.min(up, down));
}

function Treemap({ x, y, k, glow, labels }: { x: number; y: number; k: number; glow: number; labels: boolean }) {
  return (
    <g>
      {PARTS.map((p) => (
        <g key={p.label}>
          <rect x={x + p.x * k} y={y + p.y * k} width={Math.max(0, p.w * k - 2)} height={Math.max(0, p.h * k - 2)} fill={p.color} opacity={0.18 + glow * 0.3} stroke={p.color} strokeOpacity={0.85} strokeWidth={k < 1 ? 0.8 : 1} />
          {labels && <Text x={x + p.x * k + 10} y={y + p.y * k + 22} size={14} color={C.fg}>{p.label}</Text>}
        </g>
      ))}
    </g>
  );
}

export function Temptation({ t }: { t: number }) {
  const tt = t % P;
  // Anticipation: the app settles down into the box before it leaves.
  const crouch = tt < 2.1 ? Math.sin(Math.PI * phase(tt, 1.5, 2.1)) : 0;
  const away = tt >= 2.0 && tt < 8.6;
  const back = phase(tt, 8.6, 9.4);
  const lightsOff = Math.min(phase(tt, 2.1, 2.8), 1 - back);
  const copies = SLOTS.map((_, c) => presence(c, tt));
  const running = copies.filter((v) => v > 0.5).length;
  const load = Math.max(0, Math.sin(Math.PI * phase(tt, 3.2, 7.4)));

  return (
    <Scene viewBox="0 0 800 520" label="The Rails app crouches, lifts out of an always-on Linux box and lands in a Lambda function, then scales out to six copies as traffic rises and back down to none when it falls, all talking to RDS.">
      {/* The box it used to live in. */}
      <g>
        <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill={C.surface} fillOpacity={0.6 * (1 - lightsOff * 0.7)} stroke={C.fg} strokeOpacity={0.45 - lightsOff * 0.3} />
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x={BOX.x + 16 + k * 12} y={BOX.y + 16} width={7} height={7} fill={C.accent} opacity={(1 - lightsOff) * (0.25 + 0.75 * Math.max(0, Math.sin(t * 5 + k * 1.7)))} />
        ))}
        <Text x={BOX.x} y={BOX.y + BOX.h + 26} size={14} opacity={1 - lightsOff * 0.6}>a Linux box, on all day</Text>
      </g>

      {/* The app at home: crouch, then gone; fades back in at the end of the loop. */}
      {(!away || back > 0) && (
        <g opacity={tt >= 8.6 ? back : 1} transform={`translate(${HOME.x} ${HOME.y + 150}) scale(${1 + crouch * 0.03} ${1 - crouch * 0.07}) translate(${-HOME.x} ${-HOME.y - 150})`}>
          <Treemap x={HOME.x} y={HOME.y} k={1} glow={0.2 + 0.2 * Math.sin(t * 1.4)} labels />
        </g>
      )}

      {/* The flight: each block leaves on its own beat and arcs into copy 0. */}
      {away && PARTS.map((p, i) => {
        const u = inOut(clamp01(phase(tt, 2.0 + i * 0.07, 3.0 + i * 0.07)));
        if (u >= 1) return null;
        const to = inner(SLOTS[0]!);
        const ax = HOME.x + p.x, ay = HOME.y + p.y;
        const bx = to.x + p.x * K, by = to.y + p.y * K;
        const cx = (ax + bx) / 2, cy = Math.min(ay, by) - 90 - i * 6;
        const px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
        const py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
        const k = lerp(1, K, u);
        return <rect key={p.label} x={px} y={py} width={p.w * k - 2} height={p.h * k - 2} fill={p.color} fillOpacity={0.4} stroke={p.color} />;
      })}

      {/* Lambda copies. */}
      {SLOTS.map((s, c) => {
        const v = copies[c]!;
        if (v <= 0) return null;
        const filled = c === 0 ? phase(tt, 2.95, 3.15) : 1;
        const serving = 0.3 + 0.7 * Math.max(0, Math.sin(t * 5 + c * 1.3)) * load;
        const cx = s.x + SLOT.w / 2, cy = s.y + SLOT.h / 2;
        const io = inner(s);
        return (
          <g key={c}>
            <line x1={cx} y1={s.y + SLOT.h} x2={RDS.x + RDS.w / 2} y2={RDS.y} stroke={C.cyan} strokeOpacity={0.35 * Math.min(1, v)} />
            <g transform={`translate(${cx} ${cy}) scale(${v}) translate(${-cx} ${-cy})`}>
              <rect x={s.x} y={s.y} width={SLOT.w} height={SLOT.h} fill={C.surface} stroke={C.accent} strokeOpacity={0.9} />
              <Text x={s.x + 8} y={s.y + 18} size={13} color={C.accent}>λ</Text>
              <Text x={s.x + 22} y={s.y + 18} size={12} color={C.fg} mono>rails</Text>
              <g opacity={filled}><Treemap x={io.x} y={io.y} k={K} glow={serving} labels={false} /></g>
            </g>
          </g>
        );
      })}

      <Text x={SLOTS[0]!.x} y={SLOTS[0]!.y - 16} size={14} color={running ? C.fg : C.muted}>{`${running} ${running === 1 ? "copy" : "copies"} running`}</Text>
      <Database {...RDS} label="RDS" />
    </Scene>
  );
}
