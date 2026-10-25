import { C, Code, StageScene, Text, col, colSpan, ease, hash, phase, useStepTween } from "./shared";
import { Box, makeIso } from "./iso";

// Step 1: the Ruby runtime loop beside an isometric field of cubes, one per typed piece of the
// program, built left to right as Spinel infers types; the pipeline runs along the bottom.
// Step 2: the dynamic features fall off the field: there is no cube Spinel can give them.
// Step 3 (in the slide): the live page from the deployed function, with its measured numbers.
export const SPINEL_H = 357;

const LOOP = [
  "# bootstrap: the whole Lambda runtime, in Ruby",
  'require "socket"',
  'require "json"',
  "",
  "loop do",
  '  _, headers, event = http("GET", NEXT, "")',
  '  id = headers["lambda-runtime-aws-request-id"]',
  "  html = page(JSON.parse(event), primes_upto(200_000))",
  '  reply = { "statusCode" => 200, "body" => html }',
  '  http("POST", "#{INVOKE}/#{id}/response",',
  "       JSON.generate(reply))",
  "end",
];

const TYPES = [C.cyan, C.amber, C.lavender, C.accent];
const N = 13;
const FIELD = makeIso(905, 34, 18);

// Dynamic features Spinel can't compile (README "Limitations", docs/limitations.md).
const GONE = [
  { name: "eval(string)", why: "no code at run time" },
  { name: "method_missing", why: "never dispatched" },
  { name: "define_method(name)", why: "literal names only" },
  { name: "send(name)", why: "literal names only" },
  { name: "ObjectSpace, TracePoint", why: "no runtime to inspect" },
  { name: "ERB with Ruby in it", why: "templates need eval" },
];
const KEPT = ["sockets", "JSON", "exceptions", "heredocs", "blocks and instance_eval { }", "define_method(:literal)"];

const PIPE = [
  { label: "handler.rb", code: true }, { label: "spinel", tool: true }, { label: "handler.c", code: true },
  { label: "zig cc", tool: true }, { label: "bootstrap, 505 KB, arm64", code: false }, { label: "provided.al2023", code: true },
];

export function Spinel({ t, step, since }: { t: number; step: number; since: number }) {
  const [pHow, pGone] = useStepTween([step === 0 ? 1 : 0, step === 1 ? 1 : 0], step, since) as number[];
  const built = step === 0 ? ease(phase(since, 0.3, 2.6)) : 1;
  const cubes = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const r = hash(i * 31 + j * 7);
      if (r < 0.3) continue;
      // Density and size grow toward the right corner, as in the print: small, scattered, then solid.
      const reach = (i + (N - j)) / (2 * N);
      if (hash(i * 13 + j) > 0.25 + reach) continue;
      const order = (i + j) / (2 * N);
      const p = ease(phase(built, order * 0.85, order * 0.85 + 0.15));
      if (p <= 0) continue;
      const s = (0.25 + 0.65 * reach * (0.6 + 0.4 * hash(i + j * 3))) * p;
      cubes.push({ i, j, s, color: TYPES[Math.floor(hash(i * 3 + j * 11) * TYPES.length)]!, z: (1 - p) * 4 });
    }

  return (
    <StageScene h={SPINEL_H} label="Step one: the Ruby source of a whole Lambda runtime beside an isometric field of coloured cubes, one per typed piece of the program, and a pipeline from handler.rb through spinel and zig cc to a 505 KB arm64 binary. Step two: dynamic Ruby features fall off the field because Spinel can't compile them.">
      {/* The field. */}
      <g opacity={step === 2 ? 0 : 1}>
        {cubes.map((c) => (
          <Box key={`${c.i}-${c.j}`} iso={FIELD} x={c.i + (1 - c.s) / 2} y={c.j + (1 - c.s) / 2} z={c.z} w={c.s} d={c.s} h={c.s} color={c.color} />
        ))}
        <Text x={1152} y={SPINEL_H - 64} anchor="end" size={12}>one cube per typed piece of the program</Text>
      </g>

      {pHow > 0.01 && (
        <g opacity={pHow}>
          <Code x={0} y={0} w={colSpan(6)} title="src/handler.rb (excerpt)" lines={LOOP} size={12.5} lineH={18} />
          <Pipeline t={t} />
        </g>
      )}
      {pGone > 0.01 && <Gone opacity={pGone} since={step === 1 ? since : 9} t={t} />}
    </StageScene>
  );
}

function Pipeline({ t }: { t: number }) {
  const y = SPINEL_H - 34;
  let x = 0;
  const lit = Math.floor((t * 0.9) % PIPE.length);
  return (
    <g>
      {PIPE.map((p, i) => {
        const w = p.label.length * (p.code ? 7.2 : 7) + 24;
        const at = x;
        x += w + 30;
        return (
          <g key={p.label}>
            <rect x={at} y={y - 18} width={w} height={28} fill={p.tool ? "none" : C.surface} stroke={i === lit ? C.accent : C.border} />
            <Text x={at + 12} y={y} size={13} mono={p.code || p.tool} color={p.tool ? C.accent : C.fg}>{p.label}</Text>
            {i < PIPE.length - 1 && <Text x={at + w + 9} y={y} size={14}>→</Text>}
          </g>
        );
      })}
    </g>
  );
}

function Gone({ opacity, since, t }: { opacity: number; since: number; t: number }) {
  return (
    <g opacity={opacity}>
      <Text x={0} y={14} size={14} color={C.coral}>what Spinel can't compile</Text>
      {GONE.map((g, k) => {
        const p = ease(phase(since, 0.2 + k * 0.15, 0.6 + k * 0.15));
        const y = 46 + k * 34;
        return (
          <g key={g.name} opacity={p}>
            <rect x={0} y={y - 11} width={10} height={10} fill={C.coral} />
            <Text x={20} y={y} size={14} mono color={C.fg}>{g.name}</Text>
            <Text x={250} y={y} size={13}>{g.why}</Text>
          </g>
        );
      })}
      <Text x={0} y={272} size={14} color={C.accent}>what still works</Text>
      <Text x={0} y={296} size={13} color={C.fg} mono>{KEPT.slice(0, 3).join(", ")}</Text>
      <Text x={0} y={316} size={13} color={C.fg} mono>{KEPT.slice(3).join(", ")}</Text>

      {/* The same features as cubes with nowhere to go: they drop through the field and fade. */}
      {GONE.map((g, k) => {
        const start = 0.5 + k * 0.35;
        const fall = phase(since, start, start + 1.4);
        const at = FIELD.at([3 + k * 1.6, 2 + (k % 3) * 2.5, 6 - 22 * fall * fall]);
        return (
          <g key={g.name} opacity={1 - phase(since, start + 0.9, start + 1.4)}>
            <rect x={at[0] - 9} y={at[1] - 9 + Math.sin(t * 3 + k) * (fall > 0 ? 0 : 2)} width={18} height={18} fill="none" stroke={C.coral} strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
}
