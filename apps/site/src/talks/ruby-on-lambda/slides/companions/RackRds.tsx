import { C, Chip, Database, LambdaBox, Packet, Scene, Text, Wire, ease, hash, life, phase, type Pt } from "./shared";

const P = 11;
const LIMIT = 5;
const RDS = { x: 870, y: 150, w: 120, h: 120 };
const PROXY = { x: 720, y: 195, w: 110, h: 50 };
const BUS = 470;
const SLOTS = Array.from({ length: 8 }, (_, i) => ({ x: 494 + (i % 2) * 104, y: 60 + Math.floor(i / 2) * 90 }));
const SW = 92;
const SH = 52;

// One environment, zoomed: the Ruby stack a request falls through.
const Z = { x: 0, y: 34, w: 444, h: 380 };
const RAIL = Z.x + 92;
const ROW0 = Z.y + 138;
const PITCH = 44;
const SQL = 'SELECT * FROM "orders" WHERE ("id" = 8812)';
const STACK = [
  { gem: "lamby", code: "Lambda event → Rack env", color: C.accent, prose: true },
  { gem: "sinatra", code: 'get "/orders/:id" do', color: C.accent },
  { gem: "sequel", code: "DB[:orders].where(id: 8812)", color: C.accent },
  { gem: "sql", code: SQL, color: C.cyan },
  { gem: "pg", code: "libpq socket, held open", color: C.cyan, prose: true },
];
const rowY = (i: number) => ROW0 + i * PITCH;
const REQ = 2.6;

function Stack({ t, pooled, fade }: { t: number; pooled: number; fade: number }) {
  const q = (t % REQ) / REQ;
  const top = rowY(0) - 26;
  const bottom = rowY(STACK.length - 1);
  const down = phase(q, 0.05, 0.45);
  const up = phase(q, 0.58, 0.85);
  const y = q < 0.45 ? top + (bottom - top) * down : q < 0.58 ? bottom : bottom + (top - bottom) * up;
  const moving = q > 0.05 && q < 0.85;
  const typed = Math.floor(phase(q, 0.33, 0.43) * SQL.length);
  const rail: Pt[] = [[RAIL, top], [RAIL, bottom]];
  const back: Pt[] = [[RAIL, bottom], [RAIL, top]];

  return (
    <LambdaBox {...Z} title="app.rb">
      <Text x={Z.x + Z.w - 16} y={Z.y + 24} anchor="end" size={11}>one environment</Text>
      <Text x={Z.x + 16} y={Z.y + 60} size={15} color={C.fg} mono>{'DB = Sequel.connect(ENV["DATABASE_URL"])'}</Text>
      <Text x={Z.x + 16} y={Z.y + 82} size={12} color={C.amber}>
        {"runs once at init · DATABASE_URL → "}
        <tspan fill={pooled > 0.5 ? C.accent : C.cyan} opacity={fade}>{pooled > 0.5 ? "the proxy" : "RDS directly"}</tspan>
      </Text>
      <line x1={Z.x + 16} x2={Z.x + Z.w - 16} y1={Z.y + 98} y2={Z.y + 98} stroke={C.border} />

      <Wire pts={rail} opacity={0.8} />
      {STACK.map((row, i) => {
        const ry = rowY(i);
        const hit = moving ? Math.max(0, 1 - Math.abs(y - ry) / 34) : 0;
        const isSql = row.gem === "sql";
        return (
          <g key={row.gem}>
            <rect x={Z.x + 10} y={ry - 20} width={Z.w - 20} height={30} fill={row.color} opacity={hit * 0.12} />
            <rect x={RAIL - 3} y={ry - 8} width={6} height={6} fill={row.color} opacity={0.35 + hit * 0.65} />
            <Text x={Z.x + 18} y={ry} size={14.5} color={row.color} mono opacity={0.85 + hit * 0.15}>{row.gem}</Text>
            <Text x={RAIL + 16} y={ry} size={14.5} color={hit > 0.3 ? C.fg : C.muted} mono={!("prose" in row)}>
              {isSql ? SQL.slice(0, typed) : row.code}
            </Text>
          </g>
        );
      })}
      <Packet pts={rail} p={q < 0.45 ? down : 0} r={3.5} />
      <Packet pts={back} p={q >= 0.58 ? up : 0} r={3.5} color={C.cyan} />
      <Text x={Z.x + Z.w - 16} y={rowY(0) - 24} anchor="end" size={11} color={C.accent} opacity={life(q * REQ, 2.2, 2.6)}>200 · json</Text>
      <Text x={Z.x + 18} y={Z.y + Z.h - 14} size={12}>Support looks up order 8812. Same gems as on a server.</Text>
    </LambdaBox>
  );
}

export function RackRds({ t }: { t: number }) {
  const tt = t % P;
  const load = ease(phase(tt, 0.3, 5));
  const n = 1 + Math.round(7 * load);
  const pooled = ease(phase(tt, 6.6, 7.4));
  const fade = 1 - phase(tt, 10.3, 10.95);
  const conns = pooled > 0.5 ? 3 : n;
  const over = conns > LIMIT;
  const s0 = SLOTS[0]!;

  return (
    <Scene label="Inside one Lambda environment a request falls through lamby, Sinatra, Sequel and pg; across the fleet each environment holds its own database connection until RDS refuses, then RDS Proxy pools them.">
      <Stack t={t} pooled={pooled} fade={fade} />
      <line x1={Z.x + Z.w} y1={Z.y} x2={s0.x} y2={s0.y} stroke={C.muted} strokeOpacity={0.7} strokeDasharray="2 5" />
      <line x1={Z.x + Z.w} y1={Z.y + Z.h} x2={s0.x} y2={s0.y + SH} stroke={C.muted} strokeOpacity={0.7} strokeDasharray="2 5" />

      <Chip x={BUS - 30} y={6} w={92} label="fn URL" />
      <Text x={BUS + 72} y={28} size={11}>support team · orders tool</Text>
      <g opacity={fade}>
        <Wire pts={[[BUS, 40], [BUS, SLOTS[6]!.y + SH / 2]]} opacity={0.7} />
        {SLOTS.map((s, i) => {
          const on = i < n;
          const mid: Pt = [s.x + SW, s.y + SH / 2];
          const inWire: Pt[] = [[BUS, 40], [BUS, mid[1]], [s.x, mid[1]]];
          const direct: Pt[] = [mid, [RDS.x, RDS.y + 30 + i * 8]];
          const viaProxy: Pt[] = [mid, [PROXY.x, PROXY.y + 10 + i * 4]];
          const refused = !pooled && i >= LIMIT;
          const p = (t * 0.8 + hash(i)) % 1;
          return (
            <g key={i} opacity={on ? 1 : 0.06} style={{ transition: "opacity .4s" }}>
              <Wire pts={inWire} opacity={0.5} />
              {on && <Packet pts={inWire} p={p} r={2.5} />}
              <LambdaBox x={s.x} y={s.y} w={SW} h={SH} title="app.rb" draw={on ? 1 : 0.3} color={refused && on ? C.coral : C.accent}>
                <Text x={s.x + 14} y={s.y + 42} size={10} color={refused ? C.coral : C.muted}>{refused ? "refused" : "1 conn"}</Text>
              </LambdaBox>
              <g opacity={1 - pooled}>
                <Wire pts={direct} color={refused ? C.coral : C.fg} dashed={refused} opacity={refused ? 0.9 : 0.35} />
                {on && !refused && <Packet pts={direct} p={(p + 0.4) % 1} r={2.5} color={C.cyan} />}
              </g>
              <g opacity={pooled}>
                <Wire pts={viaProxy} color={C.accent} opacity={0.5} />
                {on && pooled > 0.9 && <Packet pts={viaProxy} p={(p + 0.4) % 1} r={2.5} color={C.accent} />}
              </g>
            </g>
          );
        })}

        <g opacity={pooled}>
          <rect x={PROXY.x} y={PROXY.y} width={PROXY.w} height={PROXY.h} fill={C.surface} stroke={C.accent}
            pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pooled} />
          <Text x={PROXY.x + PROXY.w / 2} y={PROXY.y + 30} anchor="middle" size={12} color={C.accent}>RDS Proxy</Text>
          {[0, 1, 2].map((k) => {
            const w: Pt[] = [[PROXY.x + PROXY.w, PROXY.y + 14 + k * 11], [RDS.x, RDS.y + 50 + k * 10]];
            return (
              <g key={k}>
                <Wire pts={w} color={C.accent} opacity={0.7} />
                {pooled > 0.9 && <Packet pts={w} p={(t * 1.3 + k / 3) % 1} r={2.5} color={C.accent} />}
              </g>
            );
          })}
        </g>

        <Database {...RDS} label="Postgres" color={over ? C.coral : C.fg} glow={over ? 1 : 0} />
        <Text x={RDS.x} y={RDS.y + RDS.h + 30} size={11}>connections</Text>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={RDS.x + i * 15} y={RDS.y + RDS.h + 40} width={11} height={16}
            fill={i >= conns ? C.border : i >= LIMIT ? C.coral : C.accent} opacity={i >= conns ? 0.5 : 0.9} style={{ transition: "fill .3s" }} />
        ))}
        <line x1={RDS.x + LIMIT * 15 - 2} x2={RDS.x + LIMIT * 15 - 2} y1={RDS.y + RDS.h + 34} y2={RDS.y + RDS.h + 62} stroke={C.coral} />
        <Text x={RDS.x + RDS.w} y={RDS.y - 22} anchor="end" size={11} mono color={C.coral} opacity={over ? life(tt, 4.2, 6.8) : 0}>FATAL: sorry, too many clients already</Text>
      </g>
    </Scene>
  );
}
