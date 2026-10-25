import { C, StageScene, Text, clamp01, col, ease, hash, lerp, phase, useStepTween } from "./shared";

// A month of traffic as a terrain: one ridgeline per day, back to front, like a topographic map.
// The terrain slowly reshapes between bursty and steady; pins drop onto it where things bite,
// and the meter on the right says who is cheaper for the shape on screen.
export const WHEN_H = 421;
const DAYS = 16;
const BINS = 96; // 15-minute bins
const AMP = 112;
// Columns 1–8 hold the terrain: the front ridge starts on the margin, depth pushes back ridges right,
// and the label for the server plane takes the last 70 px. Columns 9–12 hold the meter.
const TERRAIN_W = col(8) - 24;
const DEPTH_X = 60;
const STEP_X = (TERRAIN_W - DEPTH_X - 76) / (BINS - 1);
const baseY = (r: number) => 184 + r * 10;
const xAt = (r: number, i: number) => (DAYS - 1 - r) * (DEPTH_X / (DAYS - 1)) + i * STEP_X;

// Bursts: a launch, an import, webhook storms. Placed by hand so pins have peaks to stand on.
const SPIKES = [
  { r: 2, i: 20, h: 0.7, w: 2.2 }, { r: 3, i: 70, h: 0.55, w: 3 }, { r: 5, i: 44, h: 1.0, w: 2 },
  { r: 7, i: 12, h: 0.6, w: 1.6 }, { r: 8, i: 80, h: 0.85, w: 2.4 }, { r: 10, i: 30, h: 0.5, w: 2 },
  { r: 12, i: 60, h: 0.92, w: 1.8 }, { r: 13, i: 88, h: 0.42, w: 1.5 }, { r: 0, i: 50, h: 0.5, w: 2 },
];
const IMPORT = { r: 9, from: 50, to: 63, h: 0.62 }; // a long CSV import: a plateau, not a spike

function bursty(r: number, i: number) {
  let v = 0.025 + hash(r * 131 + i) * 0.03;
  for (const s of SPIKES) if (s.r === r) v += s.h * Math.exp(-((i - s.i) ** 2) / (2 * s.w * s.w));
  if (r === IMPORT.r && i >= IMPORT.from && i <= IMPORT.to) v += IMPORT.h * Math.min(1, (i - IMPORT.from + 1) / 2, (IMPORT.to - i + 1) / 2);
  return v;
}
function steady(r: number, i: number) {
  const day = 0.5 - 0.5 * Math.cos(((i - 8) / BINS) * Math.PI * 2); // quiet at night, busy by day
  return 0.3 + 0.32 * day + (hash(r * 977 + i) - 0.5) * 0.05;
}

type Kind = "bad" | "fix" | "win";
const KIND_COLOR: Record<Kind, string> = { bad: C.coral, fix: C.cyan, win: C.accent };
type Pin = { r: number; i: number; lx: number; ly: number; text: string; kind: Kind };
const BURSTY_PINS: Pin[] = [
  { r: 0, i: 50, lx: col(0), ly: 16, text: "6 MB payload cap: uploads go straight to S3", kind: "bad" },
  { r: 3, i: 70, lx: col(4), ly: 16, text: "SQS in front: let the burst drain", kind: "fix" },
  { r: 2, i: 20, lx: col(0), ly: 44, text: "RDS means a VPC; a VPC needs NAT to reach Stripe", kind: "bad" },
  { r: 8, i: 80, lx: col(4), ly: 44, text: "each copy opens a Postgres connection: RDS Proxy", kind: "fix" },
  { r: 5, i: 44, lx: col(2), ly: 72, text: "a spike: dozens of cold starts at once", kind: "bad" },
  { r: 12, i: 60, lx: col(5), ly: 72, text: "1,000 concurrent copies per account", kind: "bad" },
  { r: 10, i: 30, lx: col(0), ly: 100, text: "cache at CloudFront or Cloudflare before Lambda wakes", kind: "fix" },
  { r: 9, i: 57, lx: col(4), ly: 100, text: "a 2 GB import hits the 15-minute cap", kind: "bad" },
  { r: 14, i: 34, lx: col(0), ly: 128, text: "3 a.m.: nothing running, nothing billed", kind: "win" },
];
const STEADY_PINS: Pin[] = [
  { r: 6, i: 52, lx: col(3), ly: 16, text: "busy all day: per-request pricing, all day", kind: "bad" },
  { r: 11, i: 36, lx: col(0), ly: 44, text: "one box at 60% busy does this for less", kind: "win" },
  { r: 4, i: 70, lx: col(4), ly: 44, text: "each copy warms its own cache; nothing is shared", kind: "bad" },
  { r: 9, i: 20, lx: col(0), ly: 100, text: "Kamal and a VPS: a deploy that just works", kind: "win" },
  { r: 13, i: 78, lx: col(4), ly: 100, text: "CloudWatch bills logs per GB ingested", kind: "bad" },
];
const LIMITS = ["15 min per run", "6 MB request and response", "10 GB memory", "512 MB /tmp by default", "1,000 copies per account", "250 MB unzipped", "init capped at 10 s", "no SnapStart for Ruby"];

export function WhenToUse({ t, step, since }: { t: number; step: number; since: number }) {
  // 0 = bursty, 1 = steady. Holds on each long enough to read the pins.
  // Step 1 is bursty traffic, step 2 steady; the terrain morphs between them over two seconds.
  const [m] = useStepTween([step === 0 ? 0 : 1], step, since * 0.45) as [number];
  const value = (r: number, i: number) => lerp(bursty(r, i), steady(r, i), m);

  // Utilization of a server sized for the month's peak, and cost shapes (illustrative units).
  let sum = 0;
  let peak = 0;
  for (let r = 0; r < DAYS; r++) for (let i = 0; i < BINS; i += 2) { const v = value(r, i); sum += v; peak = Math.max(peak, v); }
  const mean = sum / (DAYS * (BINS / 2));
  const capacity = Math.max(peak, 0.5);
  const busy = mean / capacity;
  const lambdaCost = mean * 3;
  const serverCost = capacity;
  const lambdaWins = lambdaCost < serverCost;

  const pinsA = BURSTY_PINS.map((p, k) => ({ p, show: step === 0 ? ease(phase(since, 0.6 + k * 0.32, 1.0 + k * 0.32)) : 0 }));
  const pinsB = STEADY_PINS.map((p, k) => ({ p, show: step === 1 ? ease(phase(since, 2.2 + k * 0.4, 2.6 + k * 0.4)) : 0 }));

  return (
    <StageScene h={WHEN_H} label="A month of traffic drawn as a terrain of ridgelines, one per day, slowly changing between bursty and steady. Pins mark where serverless bites or helps: cold-start spikes, concurrency limits, connections and RDS Proxy, the 15-minute cap, SQS, VPC and NAT, caching, idle nights; for steady traffic, per-request pricing, unshared caches, log costs and a plain server. A meter compares the cost of Lambda with a server sized for the peak, and a strip lists Lambda's hard limits.">
      <Terrain value={value} capacity={capacity} />
      {[...pinsA, ...pinsB].map(({ p, show }, k) => show > 0.01 && <PinMark key={k} pin={p} show={show} value={value} />)}
      <Meter mode={m} busy={busy} lambdaCost={lambdaCost} serverCost={serverCost} lambdaWins={lambdaWins} />
      <Limits t={t} />
    </StageScene>
  );
}

function Terrain({ value, capacity }: { value: (r: number, i: number) => number; capacity: number }) {
  const ridges = [];
  for (let r = 0; r < DAYS; r++) {
    const y0 = baseY(r);
    // The stroke is only the curve; the fill closes down to the baseline to hide the ridges behind.
    let line = "";
    for (let i = 0; i < BINS; i++) line += `${i ? " L" : "M"} ${xAt(r, i).toFixed(1)} ${(y0 - value(r, i) * AMP).toFixed(1)}`;
    const d = `M ${xAt(r, 0)} ${y0} ${line.replace(/^M/, "L")} L ${xAt(r, BINS - 1)} ${y0} Z`;
    const depth = r / (DAYS - 1);
    ridges.push(
      <g key={r}>
        <path d={d} fill={C.bg} />
        <path d={line} fill="none" stroke={C.fg} strokeOpacity={0.28 + depth * 0.6} strokeWidth={1} />
      </g>,
    );
  }
  const front = DAYS - 1;
  const capY = baseY(front) - capacity * AMP;
  return (
    <g>
      {ridges}
      {/* A server is sized for the peak, every day: a plane hovering over the terrain. The gap is idle capacity. */}
      {Array.from({ length: DAYS }, (_, r) => r).filter((r) => r % 3 === 0 || r === front).map((r) => {
        const y = baseY(r) - capacity * AMP;
        return <line key={r} x1={xAt(r, 0)} x2={xAt(r, BINS - 1)} y1={y} y2={y} stroke={C.lavender} strokeOpacity={0.3 + 0.6 * (r / front)} strokeDasharray="4 4" />;
      })}
      <line x1={xAt(0, 0)} y1={baseY(0) - capacity * AMP} x2={xAt(front, 0)} y2={capY} stroke={C.lavender} strokeOpacity={0.5} />
      <line x1={xAt(0, BINS - 1)} y1={baseY(0) - capacity * AMP} x2={xAt(front, BINS - 1)} y2={capY} stroke={C.lavender} strokeOpacity={0.5} />
      <Text x={xAt(front, BINS - 1) + 6} y={capY + 4} size={12} color={C.lavender}>server</Text>
      <Text x={xAt(front, BINS - 1) + 6} y={capY + 19} size={12} color={C.lavender}>sized for</Text>
      <Text x={xAt(front, BINS - 1) + 6} y={capY + 34} size={12} color={C.lavender}>the peak</Text>
      <Text x={xAt(front, 0)} y={354} size={12}>one ridge per day, 00:00 to 24:00</Text>
      <Text x={xAt(front, BINS - 1)} y={354} anchor="end" size={12}>a month of requests</Text>
    </g>
  );
}

function PinMark({ pin, show, value }: { pin: Pin; show: number; value: (r: number, i: number) => number }) {
  const ax = xAt(pin.r, pin.i);
  const ay = baseY(pin.r) - value(pin.r, pin.i) * AMP;
  const color = KIND_COLOR[pin.kind];
  const w = pin.text.length * 6.3 + 22;
  const drop = (1 - show) * -10;
  return (
    <g opacity={show}>
      <line x1={pin.lx + 5} y1={pin.ly + 14} x2={ax} y2={ay} stroke={color} strokeOpacity={0.7} />
      <rect x={ax - 3} y={ay - 3} width={6} height={6} fill={color} />
      <g transform={`translate(0 ${drop})`}>
        <rect x={pin.lx} y={pin.ly - 12} width={w} height={20} fill={C.bg} stroke={color} strokeOpacity={0.6} />
        <rect x={pin.lx} y={pin.ly - 12} width={10} height={20} fill={color} />
        <Text x={pin.lx + 16} y={pin.ly + 2} size={12.5} color={C.fg}>{pin.text}</Text>
      </g>
    </g>
  );
}

function Meter({ mode, busy, lambdaCost, serverCost, lambdaWins }: { mode: number; busy: number; lambdaCost: number; serverCost: number; lambdaWins: boolean }) {
  const x = col(8);
  const bx = col(9);
  const bw = 1152 - bx;
  const scale = (v: number) => (v / 1.5) * bw;
  const steadyView = mode > 0.5;
  return (
    <g>
      <Text x={x} y={20} size={13} color={steadyView ? C.lavender : C.accent}>{steadyView ? "Steady traffic" : "Bursty traffic"}</Text>
      <Text x={x} y={40} size={13}>{steadyView ? "an API busy all day, every day" : "a launch, an import, a webhook storm"}</Text>

      <Text x={x} y={88} size={13}>a peak-sized server is busy</Text>
      <Text x={x} y={132} size={44} weight={300} color={C.fg}>{`${Math.round(busy * 100)}%`}</Text>
      <Text x={x + 50 + String(Math.round(busy * 100)).length * 25} y={132} size={15}>of the time</Text>

      <Text x={x} y={176} size={13}>what the month costs</Text>
      {[{ l: "Lambda", v: lambdaCost, c: C.accent }, { l: "Server", v: serverCost, c: C.lavender }].map((b, k) => (
        <g key={b.l}>
          <Text x={x} y={204 + k * 32} size={13} color={C.fg}>{b.l}</Text>
          <rect x={bx} y={193 + k * 32} width={bw} height={14} fill="none" stroke={C.border} />
          <rect x={bx} y={193 + k * 32} width={clamp01(scale(b.v) / bw) * bw} height={14} fill={b.c} opacity={0.85} />
        </g>
      ))}
      <Text x={x} y={276} size={24} weight={300} color={lambdaWins ? C.accent : C.lavender}>{lambdaWins ? "Lambda wins" : "A server wins"}</Text>

      <line x1={x} x2={1152} y1={296} y2={296} stroke={C.border} />
      <Text x={x} y={316} size={13} color={C.fg}>Startups already live here</Text>
      <Text x={x} y={335} size={13}>cloud credits for funded startups,</Text>
      <Text x={x} y={354} size={13}>and no ops hire patching servers</Text>
    </g>
  );
}

/** The hard limits, in a strip under everything, scrolling slowly like a ticker. */
function Limits({ t }: { t: number }) {
  // Sits low with room above it now that the slide has no footnote.
  const y = WHEN_H - 6;
  const items = [...LIMITS, ...LIMITS];
  let x = -((t * 18) % 1150);
  return (
    <g>
      <line x1={0} x2={1152} y1={y - 26} y2={y - 26} stroke={C.border} />
      <clipPath id="ruby-limits"><rect x={0} y={y - 20} width={TERRAIN_W} height={30} /></clipPath>
      <g clipPath="url(#ruby-limits)">
        {items.map((l, k) => {
          const at = x;
          x += l.length * 6.6 + 40;
          return (
            <g key={k}>
              <rect x={at} y={y - 9} width={6} height={6} fill={C.coral} />
              <Text x={at + 14} y={y} size={13} color={C.fg}>{l}</Text>
            </g>
          );
        })}
      </g>
      <Text x={col(8)} y={y} size={13} color={C.muted}>{"the hard limits, all the time"}</Text>
      <rect x={col(8) - 12} y={y - 20} width={1} height={28} fill={C.border} />
    </g>
  );
}
