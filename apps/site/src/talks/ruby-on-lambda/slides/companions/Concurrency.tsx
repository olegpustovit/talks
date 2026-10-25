import { C, StageScene, Text, col, ease, hash, phase, useFold } from "./shared";
import { Fixes } from "./Fixes";

// Step 1, on columns 5–12: the same traffic on one long-lived Puma process and on a fleet
// of Lambda copies, one loop. Step 2 folds the title away and the whole stage turns into
// four small loops, one per server trick, each run on both kinds of computer.
const P = 10;
const COLS = 60;
const BOOT = 14; // columns; the ~2.8 s cold start from the previous slide
const X0 = col(4);
const GX = X0 + 92;
const GW = 1152 - GX;
const CW = GW / COLS;
const BOOT_MS = 2800;

const COPIES = [
  { spawn: 0, dies: 27 }, { spawn: 4, dies: 41 }, { spawn: 16, dies: 35 },
  { spawn: 17, dies: 46 }, { spawn: 31, dies: 53 }, { spawn: 32, dies: 60 },
];
// Two requests land together and nobody is free: two copies, two boots.
const BURSTS = [{ at: 16, rows: [2, 3] }, { at: 31, rows: [4, 5] }];
const SERVER_Y = 126;
const LAMBDA_Y = 172;
const ROW_H = 20;
const PITCH = 30;

const servesAt = (seed: number, c: number) => hash(seed * 131 + c) > 0.45;
const fmt = (ms: number) => (ms >= 10 ? `${Math.round(ms)} ms` : `${ms.toFixed(1)} ms`);

export function Concurrency({ t, step, since }: { t: number; step: number; since: number }) {
  const b = useFold(step >= 1, step, since);
  return (
    <StageScene label="Step one: the same traffic on one long-lived Puma process and on a fleet of Lambda copies. Puma boots once; every Lambda copy boots Rails, and two requests at once mean two boots. Step two: four small loops show why YJIT, Bootsnap, connection pools and preload-and-fork help a long-running server but not Lambda.">
      {b < 1 && (
        <g opacity={1 - ease(Math.min(1, b * 1.6))} transform={`translate(${-b * 120} 0)`}>
          <Lanes t={t} />
        </g>
      )}
      {b > 0 && <Fixes t={t} enter={step >= 1 ? since : 0} fold={b} />}
    </StageScene>
  );
}

function Lanes({ t }: { t: number }) {
  const tt = t % P;
  const cursor = Math.floor(phase(tt, 0.3, 8.4) * COLS);
  const fade = 1 - phase(tt, 9.3, 10);

  let requests = 0;
  let boots = 0;
  const rows = COPIES.map((cp, r) => {
    const cells = [];
    if (cursor > cp.spawn) boots++;
    for (let c = cp.spawn; c < Math.min(cursor, cp.dies); c++) {
      const booting = c < cp.spawn + BOOT;
      const serving = !booting && (c === cp.spawn + BOOT || servesAt(r, c));
      if (serving) requests += 12;
      cells.push({ c, booting, serving });
    }
    return { cells, alive: cursor > cp.spawn && cursor < cp.dies, gone: cursor >= cp.dies };
  });
  const perReq = (n: number) => (requests ? (n * BOOT_MS) / requests : 0);
  const shown = Math.min(cursor, COLS);

  const kpi = (x: number, label: string, n: number, color: string) => (
    <g>
      <Text x={x} y={14} size={14}>{label}</Text>
      <Text x={x} y={66} size={56} weight={300} color={C.fg}>{String(n)}</Text>
      <Text x={x + (n >= 10 ? 70 : 38)} y={66} size={20} color={C.fg}>{n === 1 ? "boot" : "boots"}</Text>
      <Text x={x} y={92} size={15} color={color}>{`${fmt(perReq(n))} of boot per request*`}</Text>
    </g>
  );

  return (
    <g opacity={fade}>
      {kpi(X0, "one Puma process", 1, C.accent)}
      {kpi(X0 + 392, "Lambda copies, same traffic", boots, C.coral)}

      {/* Server lane: boot once, then serve. */}
      <Text x={GX - 14} y={SERVER_Y + 15} anchor="end" size={14} color={C.fg}>Puma</Text>
      <rect x={GX} y={SERVER_Y} width={GW} height={ROW_H} fill="none" stroke={C.border} />
      {Array.from({ length: shown }, (_, c) => (
        <rect key={c} x={GX + c * CW} y={SERVER_Y} width={CW - 1.5} height={ROW_H}
          fill={c < BOOT ? C.coral : C.accent} opacity={c < BOOT ? 0.9 : 0.35 + 0.55 * hash(c + 7)} />
      ))}

      {/* Lambda lanes: one per copy. */}
      {rows.map((row, r) => {
        const y = LAMBDA_Y + r * PITCH;
        return (
          <g key={r}>
            <Text x={GX - 14} y={y + 15} anchor="end" size={14} color={row.alive ? C.fg : C.muted} opacity={row.alive || row.gone ? 1 : 0.35}>{row.gone ? "gone" : `copy ${r + 1}`}</Text>
            <rect x={GX} y={y} width={GW} height={ROW_H} fill="none" stroke={C.border} strokeOpacity={0.5} />
            {row.cells.map((cell) => (
              <rect key={cell.c} x={GX + cell.c * CW} y={y} width={CW - 1.5} height={ROW_H}
                fill={cell.booting ? C.coral : cell.serving ? C.accent : C.border} opacity={cell.booting ? 0.9 : cell.serving ? 0.8 : 0.7} />
            ))}
          </g>
        );
      })}

      {/* Bursts: a bracket and a plain sentence when two copies start together. */}
      {BURSTS.map((bu) => {
        const on = phase(cursor, bu.at + 1, bu.at + 4);
        const y0 = LAMBDA_Y + bu.rows[0]! * PITCH;
        const y1 = LAMBDA_Y + bu.rows[1]! * PITCH + ROW_H;
        const x = GX + bu.at * CW - 8;
        return (
          <g key={bu.at} opacity={on * (cursor < bu.at + 30 ? 1 : 0.35)}>
            <path d={`M ${x + 4} ${y0} H ${x} V ${y1} H ${x + 4}`} fill="none" stroke={C.fg} />
            <Text x={x - 6} y={(y0 + y1) / 2 + 5} anchor="end" size={13} color={C.fg}>2 at once</Text>
          </g>
        );
      })}

      <line x1={GX + shown * CW} x2={GX + shown * CW} y1={SERVER_Y - 8} y2={LAMBDA_Y + COPIES.length * PITCH} stroke={C.fg} strokeOpacity={0.7} />

      {[{ l: "booting Rails", c: C.coral }, { l: "serving", c: C.accent }, { l: "idle, waiting", c: C.border }].map((g, k) => (
        <g key={g.l}>
          <rect x={GX + k * 150} y={LAMBDA_Y + COPIES.length * PITCH + 18} width={12} height={12} fill={g.c} />
          <Text x={GX + k * 150 + 20} y={LAMBDA_Y + COPIES.length * PITCH + 29} size={13}>{g.l}</Text>
        </g>
      ))}
      <Text x={1152} y={LAMBDA_Y + COPIES.length * PITCH + 29} anchor="end" size={13}>{`${requests.toLocaleString("en-US")} requests`}</Text>
    </g>
  );
}

