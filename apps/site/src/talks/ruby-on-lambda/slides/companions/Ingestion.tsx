import { Boundary, C, CoreGrid, Database, LambdaBox, Packet, PALETTE, Scene, Text, Wire, hash, type Pt } from "./shared";

const SOURCES = 46;
const SLOTS = 20;
const EVENTS = ["picked_up #8807", "in_transit #8812", "delivered #8790", "failed_attempt #8815", "delivered #8812", "picked_up #8821"];
const API: Pt = [180, 205];
const QUEUE = { x: 300, y: 196, slot: 16 };
const QUEUE_END: Pt = [QUEUE.x + SLOTS * QUEUE.slot, 205];
const GATE: Pt = [836, 282];
const DB = { x: 868, y: 250, w: 100, h: 74 };

/** Unknown, bursty load: mostly quiet, sometimes a spike. */
const burst = (t: number) => Math.pow(Math.max(0, Math.sin((t * 2 * Math.PI) / 8)), 3) * 0.85 + Math.pow(Math.max(0, Math.sin((t * 2 * Math.PI) / 3.1 + 1)), 8) * 0.25;

export function Ingestion({ t }: { t: number }) {
  const load = burst(t);
  const depth = Math.round(1 + 18 * burst(t - 0.7));
  const workers = Math.min(5, Math.max(1, Math.ceil(depth / 4)));

  const rain = [];
  for (let i = 0; i < SOURCES; i++) {
    const speed = 0.45 + hash(i) * 0.3;
    const raw = t * speed + hash(i + 50);
    const cycle = Math.floor(raw);
    if (hash(i * 13 + cycle * 7) > 0.15 + load) continue;
    const from: Pt = [8, 40 + hash(i * 5 + cycle) * 340];
    rain.push(<Packet key={i} pts={[from, [100, from[1] * 0.4 + API[1] * 0.6], API]} p={raw - cycle} color={PALETTE[i % PALETTE.length]} r={2.5} />);
  }

  const workerYs = Array.from({ length: 5 }, (_, i) => 205 + (i - 2) * 58);
  const history = Array.from({ length: 64 }, (_, k) => burst(t - (63 - k) * 0.14));

  return (
    <Scene label="Bursty events enter a Ruby API Lambda, wait in an SQS queue, and are drained by a growing number of Ruby worker Lambdas that cross into the VPC to write to the core app's database.">
      <Text x={8} y={404} size={12}>courier webhooks: picked_up · in_transit · delivered</Text>
      {rain}

      <Boundary x={150} y={40} w={660} h={330} label="ingest/ — Ruby, deployed with SST" />
      <LambdaBox x={API[0] - 20} y={170} w={100} h={70} title="api.rb" />
      <Text x={API[0] - 20} y={262} size={11} mono color={C.fg} opacity={0.4 + load * 0.6}>{EVENTS[Math.floor(t * 3) % EVENTS.length]}</Text>
      <Wire pts={[[260, 205], [QUEUE.x - 6, 205]]} />

      <Text x={QUEUE.x} y={180} color={C.fg} size={13}>SQS</Text>
      <Text x={QUEUE_END[0]} y={180} anchor="end" size={12}>{`depth ${depth}`}</Text>
      {Array.from({ length: SLOTS }, (_, i) => {
        const filled = i >= SLOTS - depth;
        return (
          <rect key={i} x={QUEUE.x + i * QUEUE.slot} y={QUEUE.y} width={QUEUE.slot - 4} height={18}
            fill={filled ? PALETTE[Math.floor(hash(i + Math.floor(t * 3)) * PALETTE.length)] : C.border}
            opacity={filled ? 0.85 : 0.5} style={{ transition: "fill .2s, opacity .2s" }} />
        );
      })}

      {workerYs.map((y, i) => {
        const on = i < workers;
        const wire: Pt[] = [QUEUE_END, [650, 205], [670, y], [690, y]];
        const out: Pt[] = [[800, y], [818, y], [818, GATE[1]], GATE];
        const p = (t * 0.9 + i * 0.37) % 1;
        return (
          <g key={i} opacity={on ? 1 : 0.07} style={{ transition: "opacity .5s" }}>
            <Wire pts={wire} />
            {on && <Packet pts={wire} p={p} r={3} color={PALETTE[(i + 1) % PALETTE.length]} />}
            <LambdaBox x={690} y={y - 22} w={110} h={44} title="worker.rb" />
            <rect x={704} y={y + 12} width={82 * ((t * 0.7 + i * 0.29) % 1)} height={2} fill={C.accent} opacity={on ? 0.8 : 0} />
            <Wire pts={out} opacity={0.6} />
            {on && <Packet pts={out} p={(p + 0.5) % 1} r={2.5} color={C.cyan} />}
          </g>
        );
      })}

      <Boundary x={836} y={40} w={152} h={330} label="VPC" color={C.cyan} />
      <CoreGrid x={856} y={62} cols={9} rows={6} t={t} cell={9} label="marketplace" sub="order status" />
      <rect x={GATE[0] - 7} y={GATE[1] - 7} width={14} height={14} fill={C.bg} stroke={C.cyan} transform={`rotate(45 ${GATE[0]} ${GATE[1]})`} />
      <Text x={GATE[0]} y={GATE[1] + 28} anchor="middle" size={11} color={C.cyan}>ENI</Text>
      <Wire pts={[[GATE[0] + 8, GATE[1]], [DB.x, GATE[1]]]} color={C.cyan} opacity={0.6} />
      <Database {...DB} label="Postgres" />

      {history.map((v, k) => (
        <rect key={k} x={150 + k * 10.3} y={432 - v * 34} width={7} height={Math.max(1, v * 34)} fill={C.amber} opacity={0.25 + (k / 64) * 0.6} />
      ))}
      <Text x={150 + 64 * 10.3 + 10} y={428} size={12}>load = bill</Text>
    </Scene>
  );
}
