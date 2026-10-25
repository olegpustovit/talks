import { Boundary, Bucket, C, Chip, CoreGrid, LambdaBox, Packet, PALETTE, Scene, Text, Wire, ease, hash, life, phase, poly, type Pt } from "./shared";

const P = 9;
const BOX = { x: 520, y: 70, w: 300, h: 290 };

// The agent's tool calls: an axis-aligned random walk that stays inside the box.
const WALK: { pts: Pt[]; calls: { at: number; x: number; y: number; s: number; c: string }[] } = (() => {
  const pts: Pt[] = [[BOX.x + 24, BOX.y + 150]];
  const calls = [];
  let [x, y] = pts[0]!;
  for (let i = 1; i < 150; i++) {
    const r = hash(i * 3.7);
    const len = 8 + hash(i * 9.1) * 22;
    if (i % 2) x = Math.min(BOX.x + BOX.w - 20, Math.max(BOX.x + 20, x + (r < 0.62 ? len : -len)));
    else y = Math.min(BOX.y + BOX.h - 62, Math.max(BOX.y + 62, y + (r < 0.5 ? len : -len)));
    pts.push([x, y]);
    if (i % 9 === 0) calls.push({ at: i, x, y, s: 4 + hash(i) * 9, c: PALETTE[1 + Math.floor(hash(i + 7) * 4)]! });
  }
  return { pts, calls };
})();

// What the agent is doing, in the order it does it.
const TOOLS = ["grep logs \"checkout\"", "git log --since=2h", "SQL: failed payments", "diff deploy 4f2a1c", "write incident note"];

const A: Pt[] = [[205, 222], [330, 222]];
const B: Pt[] = [[450, 222], [BOX.x, 222]];
const OUT: Pt[] = [[BOX.x + BOX.w, 222], [880, 222]];

export function AlertAgent({ t }: { t: number }) {
  const tt = t % P;
  const loop = Math.floor(t / P);
  const alert = phase(tt, 0.2, 1.1);
  const boot = ease(phase(tt, 1.9, 2.5));
  const run = phase(tt, 2.6, 6.4);
  const fade = 1 - phase(tt, 8.2, 8.9);
  const walked = Math.floor(run * (WALK.pts.length - 1));
  const minutes = run * 6.5;
  const stored = phase(tt, 7.1, 7.15) >= 1;

  return (
    <Scene label="An alert from the core app calls an API, which starts a Lambda running a Ruby agent for up to 15 minutes; the result is written to S3.">
      <CoreGrid x={20} y={150} cols={14} rows={10} t={t} label="marketplace" sub="main repo · Puma" />
      <rect x={20 + 13 * 13} y={150 + 5 * 13} width={10} height={10} fill={C.coral} opacity={alert > 0 && alert < 1 ? 1 : 0.15} />
      <rect x={194 - (4 + alert * 34)} y={220 - (4 + alert * 34)} width={(4 + alert * 34) * 2} height={(4 + alert * 34) * 2} fill="none" stroke={C.coral} opacity={alert > 0 ? (1 - alert) * 0.9 : 0} />

      <Text x={20} y={136} size={12} color={C.coral} opacity={life(tt, 0.2, 2.6)}>checkout 5xx &gt; 2%</Text>
      <Boundary x={312} y={42} w={676} h={352} label="alerts-agent/ — separate repo, still Ruby" />

      <Wire pts={A} />
      <Chip x={330} y={205} w={120} label="POST /alert" mono color={C.coral} active={life(tt, 1.0, 2.2)} />
      <Wire pts={B} />
      <Packet pts={A} p={phase(tt, 0.9, 1.5)} color={C.coral} />
      <Packet pts={B} p={phase(tt, 1.5, 1.95)} color={C.coral} />

      <g opacity={fade}>
        <LambdaBox {...BOX} title="agent.rb" draw={boot}>
          <Text x={BOX.x + BOX.w - 14} y={BOX.y + 24} anchor="end" size={11} color={C.amber} opacity={life(tt, 1.9, 3.0)}>cold start</Text>
          <Text x={BOX.x + 14} y={BOX.y + 46} size={11} mono color={C.lavender} opacity={run > 0 && run < 1 ? 1 : 0}>{`→ ${TOOLS[Math.min(TOOLS.length - 1, Math.floor(run * TOOLS.length))]}`}</Text>
          <polyline points={poly(WALK.pts.slice(0, walked + 1))} fill="none" stroke={C.fg} strokeOpacity={0.7} strokeWidth={0.9} />
          {WALK.calls.filter((c) => c.at <= walked).map((c) => (
            <rect key={c.at} x={c.x - c.s / 2} y={c.y - c.s / 2} width={c.s} height={c.s} fill={c.c} opacity={0.9} />
          ))}
          {walked > 0 && walked < WALK.pts.length - 1 && (
            <rect x={WALK.pts[walked]![0] - 3.5} y={WALK.pts[walked]![1] - 3.5} width={7} height={7} fill={C.accent} filter="url(#ruby-glow)" />
          )}
          <line x1={BOX.x + 20} y1={BOX.y + BOX.h - 30} x2={BOX.x + BOX.w - 20} y2={BOX.y + BOX.h - 30} stroke={C.border} strokeWidth={4} />
          <line x1={BOX.x + 20} y1={BOX.y + BOX.h - 30} x2={BOX.x + 20 + (BOX.w - 40) * (minutes / 15)} y2={BOX.y + BOX.h - 30} stroke={C.accent} strokeWidth={4} />
          <line x1={BOX.x + BOX.w - 20} y1={BOX.y + BOX.h - 38} x2={BOX.x + BOX.w - 20} y2={BOX.y + BOX.h - 22} stroke={C.coral} />
          <Text x={BOX.x + 20} y={BOX.y + BOX.h - 10} size={11}>{`${Math.floor(minutes)}:${String(Math.floor((minutes % 1) * 60)).padStart(2, "0")}`}</Text>
          <Text x={BOX.x + BOX.w - 20} y={BOX.y + BOX.h - 10} size={11} anchor="end" color={C.coral}>15:00 limit</Text>
        </LambdaBox>
      </g>

      <Wire pts={OUT} />
      <Packet pts={OUT} p={phase(tt, 6.5, 7.1)} />
      <Text x={886} y={384} size={11} mono color={C.fg} opacity={stored ? life(tt, 7.1, 8.8) : 0}>incident-checkout.md</Text>
      <Bucket x={886} y={80} w={92} h={260} count={4 + loop + (stored ? 1 : 0)} flash={stored ? 1 - phase(tt, 7.1, 8.4) : 0} label="s3://reports/" />
    </Scene>
  );
}
