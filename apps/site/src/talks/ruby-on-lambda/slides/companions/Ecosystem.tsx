import { memo } from "react";
import { C, StageScene, Text, col, colSpan, ease, hash, phase } from "./shared";

// The app as cloth: warp threads run down the stage, and each step weaves one band of the
// ecosystem through them. Tracking boxes lock onto the band being woven and point at the picks.
export const ECOSYSTEM_H = 357;
const W = col(8) - 24;
const BAND_H = 56;
const GAP = 12;
const TOP = 8;
const CARD_X = col(8);
const CARD_W = colSpan(4);

type Band = { name: string; pick: string; why: string[]; items: string[]; cost: string[]; from: string; to: string };
const BANDS: Band[] = [
  {
    name: "Adapter", pick: "Lamby", from: C.accent, to: C.cyan,
    why: ["Our forty lines handle one event shape.", "Production traffic brings four."],
    items: ["Function URLs", "API Gateway HTTP API, v1 and v2", "API Gateway REST API", "Application Load Balancer"],
    cost: ["Built around Rails, works for any", "Rack app. One more gem at boot."],
  },
  {
    name: "Framework", pick: "Sinatra, Roda or Hanami", from: C.lavender, to: C.accent,
    why: ["Routing, params and Rack middleware,", "without Rails' boot or its magic."],
    items: ["Sinatra: one file, everyone knows it", "Roda: a routing tree, opt-in plugins", "Hanami 2: structure, no Rails boot", "middleware: auth, CORS, logging"],
    cost: ["You give up Rails' generators", "and part of its gem ecosystem."],
  },
  {
    name: "Persistence", pick: "DynamoDB, or SQL behind a proxy", from: C.cyan, to: C.lavender,
    why: ["Copies come and go, so the database", "must not care how many there are."],
    items: ["DynamoDB: no connections, IAM per call", "`aws-sdk-dynamodb` or `aws-record`, one table", "Sequel on Aurora, through RDS Proxy", "Aurora DSQL: Postgres-ish, IAM tokens"],
    cost: ["DynamoDB wants your queries", "before you write the app."],
  },
  {
    name: "Jobs", pick: "SQS and a worker function", from: C.amber, to: C.coral,
    why: ["Sidekiq needs a process that stays up.", "SQS calls a function instead."],
    items: ["the web function enqueues to SQS", "Lambda polls and calls the worker", "Lambdakiq: ActiveJob, Sidekiq-style retries", "a dead-letter queue for what still fails"],
    cost: ["At-least-once delivery: every job", "must be safe to run twice."],
  },
  {
    name: "Edge", pick: "CloudFront in front", from: C.amber, to: C.accent,
    why: ["Most requests should never", "wake a Lambda at all."],
    items: ["S3 serves assets, never the function", "the Function URL sits behind OAC", "`Cache-Control` from Rack is honoured", "uploads go straight to S3, presigned"],
    cost: ["POSTs through OAC need a", "body hash header. It catches everyone."],
  },
];
const bandY = (i: number) => TOP + i * (BAND_H + GAP);
const FLOOR = bandY(BANDS.length) - GAP;

export function Ecosystem({ t, step, since }: { t: number; step: number; since: number }) {
  return (
    <StageScene h={ECOSYSTEM_H} label="A loom. Warp threads run down the stage; each step weaves one band of the Ruby-on-Lambda ecosystem through them: the adapter, the framework, persistence, background jobs and the edge. Tracking boxes lock onto the new band and point at the recommended tools, listed on the right.">
      <Weave />
      {BANDS.map((b, i) => {
        const woven = i < step ? 1 : i === step ? ease(phase(since, 0.1, 1.4)) : 0;
        return <BandRow key={b.name} i={i} band={b} woven={woven} active={i === step} t={t} />;
      })}
      <Tracking t={t} step={step} since={since} />
      <Card key={step} band={BANDS[step]!} step={step} since={since} />
    </StageScene>
  );
}

/** Warp threads and the weave pattern. Static, so drawn once. */
const Weave = memo(function Weave() {
  return (
    <g>
      <defs>
        <pattern id="ruby-weave" width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={3} height={3} fill="#fff" />
          <rect x={3} y={3} width={3} height={3} fill="#fff" />
          <rect x={3} y={0} width={2} height={3} fill="#fff" opacity={0.5} />
          <rect x={0} y={3} width={2} height={3} fill="#fff" opacity={0.5} />
        </pattern>
        <mask id="ruby-weave-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={FLOOR + 10}>
          <rect width={W} height={FLOOR + 10} fill="url(#ruby-weave)" />
        </mask>
        {BANDS.map((b, i) => (
          <linearGradient key={i} id={`ruby-band-${i}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={{ stopColor: b.from }} />
            <stop offset="1" style={{ stopColor: b.to }} />
          </linearGradient>
        ))}
      </defs>
      {Array.from({ length: Math.floor(W / 6) + 1 }, (_, k) => (
        <line key={k} x1={k * 6 + 1.5} x2={k * 6 + 1.5} y1={0} y2={FLOOR + 6} stroke={C.border} strokeOpacity={0.45 + 0.4 * hash(k)} />
      ))}
    </g>
  );
});

/** One band of cloth: a gradient seen through the weave, with offset blocks like a glitched loom. */
const Cloth = memo(function Cloth({ i }: { i: number }) {
  const y = bandY(i);
  const blocks = Array.from({ length: 7 }, (_, k) => {
    const bx = hash(i * 31 + k) * (W - 160);
    const bw = 50 + hash(i * 17 + k * 3) * 140;
    const row = Math.floor(hash(i * 7 + k * 5) * 3);
    return { bx, bw, by: y + row * (BAND_H / 3), dark: hash(i + k * 11) > 0.55 };
  });
  return (
    <g mask="url(#ruby-weave-mask)">
      <rect x={0} y={y} width={W} height={BAND_H} fill={`url(#ruby-band-${i})`} />
      {blocks.map((b, k) => (
        <rect key={k} x={b.bx} y={b.by} width={b.bw} height={BAND_H / 3} fill={b.dark ? C.bg : `url(#ruby-band-${(i + 2) % BANDS.length})`} opacity={b.dark ? 0.75 : 0.9} />
      ))}
    </g>
  );
});

function BandRow({ i, band, woven, active, t }: { i: number; band: Band; woven: number; active: boolean; t: number }) {
  const y = bandY(i);
  const front = woven * W;
  const scan = ((t * 140) % (W + 200)) - 100;
  return (
    <g>
      <clipPath id={`ruby-woven-${i}`}><rect x={0} y={y - 2} width={front} height={BAND_H + 4} /></clipPath>
      <g clipPath={`url(#ruby-woven-${i})`} opacity={active ? 1 : 0.6}>
        <Cloth i={i} />
        {active && <rect x={scan} y={y} width={60} height={BAND_H} fill={C.fg} opacity={0.12} mask="url(#ruby-weave-mask)" />}
      </g>
      {/* The shuttle: where the weave is being made right now. */}
      {woven > 0 && woven < 1 && <rect x={front - 1} y={y - 6} width={2} height={BAND_H + 12} fill={C.fg} />}
      <rect x={0} y={y} width={band.name.length * 7.4 + 34} height={20} fill={C.bg} opacity={woven > 0 ? 0.92 : 0} />
      <Text x={8} y={y + 14} size={12} color={active ? C.fg : C.muted}>{`${String(i + 1).padStart(2, "0")}  ${band.name}`}</Text>
    </g>
  );
}

/** Tracking boxes: they find spots on the new band, drift a little, and lead to the list. */
function Tracking({ t, step, since }: { t: number; step: number; since: number }) {
  const y = bandY(step);
  return (
    <g>
      {[0, 1, 2, 3].map((k) => {
        const p = ease(phase(since, 1.0 + k * 0.22, 1.6 + k * 0.22));
        if (p <= 0) return null;
        // Four lanes of 150, so boxes never overlap; size and offset vary per band.
        const bw = 88 + hash(step * 13 + k) * 44;
        const bx = 140 + k * 150 + hash(step * 5 + k) * (140 - bw) + Math.sin(t * 0.8 + k * 1.9) * 4;
        const by = y - 7 + Math.cos(t * 0.6 + k) * 2;
        const tx = CARD_X - 10;
        const ty = itemY(k) - 5;
        return (
          <g key={`${step}-${k}`}>
            <rect x={bx} y={by} width={bw} height={BAND_H + 14} fill="none" stroke={C.fg} strokeOpacity={0.9}
              pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            <rect x={bx} y={by - 16} width={20} height={16} fill={C.fg} opacity={p} />
            <Text x={bx + 10} y={by - 4} anchor="middle" size={11} color={C.bg} opacity={p}>{String(k + 1)}</Text>
            <path d={`M ${bx + bw} ${by} L ${tx - 30} ${ty} L ${tx} ${ty}`} fill="none" stroke={C.fg} strokeOpacity={0.35 * p} />
          </g>
        );
      })}
    </g>
  );
}

const itemY = (k: number) => 150 + k * 38;

/** Backticks mark code inside an item: gem names stay in the code face, the rest in Geist. */
function Rich({ x, y, text, size, color }: { x: number; y: number; text: string; size: number; color: string }) {
  return (
    <text x={x} y={y} fontSize={size} fill={color}>
      {text.split("`").map((part, k) => <tspan key={k} className={k % 2 ? "ruby-mono" : undefined} fill={k % 2 ? C.amber : undefined}>{part}</tspan>)}
    </text>
  );
}

function Card({ band, step, since }: { band: Band; step: number; since: number }) {
  const p = ease(phase(since, 0.2, 0.8));
  return (
    <g opacity={p} transform={`translate(${(1 - p) * 16} 0)`}>
      <Text x={CARD_X} y={14} size={13} color={C.accent}>{`${String(step + 1).padStart(2, "0")} / ${band.name}`}</Text>
      <Text x={CARD_X} y={50} size={26} weight={300} color={C.fg}>{band.pick}</Text>
      {band.why.map((l, k) => <Text key={k} x={CARD_X} y={82 + k * 21} size={15} color={C.muted}>{l}</Text>)}
      {band.items.map((item, k) => {
        const q = ease(phase(since, 1.0 + k * 0.22, 1.5 + k * 0.22));
        return (
          <g key={k} opacity={q}>
            <rect x={CARD_X} y={itemY(k) - 15} width={20} height={16} fill={C.fg} />
            <Text x={CARD_X + 10} y={itemY(k) - 3} anchor="middle" size={11} color={C.bg}>{String(k + 1)}</Text>
            <Rich x={CARD_X + 32} y={itemY(k)} text={item} size={15} color={C.fg} />
          </g>
        );
      })}
      <g opacity={ease(phase(since, 2.1, 2.6))}>
        <line x1={CARD_X} x2={CARD_X + CARD_W} y1={FLOOR - 52} y2={FLOOR - 52} stroke={C.border} />
        {band.cost.map((l, k) => <Text key={k} x={CARD_X} y={FLOOR - 28 + k * 19} size={14} color={C.coral}>{l}</Text>)}
      </g>
    </g>
  );
}
