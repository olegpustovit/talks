import { C, Chip, PALETTE, Packet, Scene, Text, Wire, ease, hash, phase, type Pt } from "./shared";

// The internet: computers that someone owns, wired to their neighbours.
const NODES: Pt[] = Array.from({ length: 30 }, (_, i) => [40 + hash(i * 2.3) * 720, 40 + hash(i * 5.9 + 1) * 440]);
const EDGES: [number, number][] = (() => {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  NODES.forEach((a, i) => {
    NODES.map((b, j) => ({ j, d: Math.hypot(a[0] - b[0], a[1] - b[1]) }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = [Math.min(i, j), Math.max(i, j)].join("-");
        if (!seen.has(key)) { seen.add(key); out.push([i, j]); }
      });
  });
  return out;
})();

const APP: Pt = [150, 260];
const HOSTS = [
  { name: "free PaaS", catch: "falls asleep", color: C.amber },
  { name: "no-code builder", catch: "not your server", color: C.lavender },
  { name: "free VM", catch: "one tiny CPU", color: C.cyan },
];
const HOST_X = 470;
const hostY = (i: number) => 110 + i * 150;

export function Network({ t, step }: { t: number; step: number }) {
  const lonely = step >= 1;
  const net = lonely ? 0.16 : 1;
  const visit = Math.floor(t / 2.2) % HOSTS.length;
  const u = (t % 2.2) / 2.2;
  return (
    <Scene viewBox="0 0 800 520" label="A network of computers owned by someone else; your app looks for a free one and every option has a catch.">
      <g opacity={net} style={{ transition: "opacity .8s" }}>
        {EDGES.map(([a, b], k) => {
          const pts: Pt[] = [NODES[a]!, NODES[b]!];
          return (
            <g key={k}>
              <Wire pts={pts} opacity={0.6} />
              <Packet pts={hash(k) > 0.5 ? pts : [pts[1]!, pts[0]!]} p={(t * (0.25 + hash(k + 3) * 0.35) + hash(k)) % 1} r={2.5} color={PALETTE[k % PALETTE.length]} />
            </g>
          );
        })}
        {NODES.map(([x, y], i) => (
          <rect key={i} x={x - 7} y={y - 7} width={14} height={14} fill={C.bg} stroke={C.fg} strokeOpacity={0.7} />
        ))}
      </g>

      <g opacity={ease(lonely ? 1 : 0)} style={{ transition: "opacity .8s" }}>
        <rect x={APP[0] - 26} y={APP[1] - 26} width={52} height={52} fill={C.accent} opacity={0.85 + Math.sin(t * 3) * 0.15} filter="url(#ruby-glow)" />
        <Text x={APP[0]} y={APP[1] + 56} anchor="middle" size={16} color={C.fg}>your app</Text>
        {HOSTS.map((h, i) => {
          const y = hostY(i);
          const wire: Pt[] = [[APP[0] + 26, APP[1]], [300, APP[1]], [330, y], [HOST_X, y]];
          const here = visit === i;
          // The app reaches for this option, then the catch lights up.
          const reach = here ? phase(u, 0, 0.35) : 0;
          const refused = here ? phase(u, 0.4, 0.55) : 0;
          return (
            <g key={h.name}>
              <Wire pts={wire} opacity={0.35} />
              <Wire pts={wire} color={h.color} width={2} opacity={reach * (1 - refused * 0.6)} />
              <Chip x={HOST_X} y={y - 17} w={190} label={h.name} color={h.color} active={here ? 1 : 0.35} />
              <Text x={HOST_X + 206} y={y + 6} size={16} color={C.coral} opacity={0.35 + refused * 0.65}>{h.catch}</Text>
            </g>
          );
        })}
      </g>
    </Scene>
  );
}
