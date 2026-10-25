import { C, Code, Flow, StageScene, Text, codeHeight, col, colSpan, ease, phase, useStepTween } from "./shared";
import { BOOTSTRAP, RUNTIME } from "./code";

// One copy, cut open, and kept on screen through four steps; it moves and re-labels itself.
// 1. Anatomy: a micro VM with Linux, Ruby, your gems and code, and bootstrap, the loop.
// 2. Who owns which layer: managed runtime, container image, custom runtime, side by side.
// 3. Native gems: what a Mac-built vendor/bundle does on Linux, and the fix for each kind.
// 4. Custom runtime: the loop itself, in Ruby, talking to the Runtime API.

type Owner = "aws" | "you";
type Layer = { name: string; mono?: boolean; detail: string; detailMono?: boolean; h: number };
const LAYERS: Layer[] = [
  { name: "bootstrap", mono: true, detail: "the loop: fetch an event, call your code", h: 56 },
  { name: "your code", detail: "handler.rb, app.rb", detailMono: true, h: 56 },
  { name: "gems", detail: "vendor/bundle", detailMono: true, h: 56 },
  { name: "Ruby 3.4", detail: "the interpreter", h: 48 },
  { name: "Amazon Linux 2023", detail: "the micro VM's OS", h: 48 },
];
const BOOT = 0, CODE = 1, GEMS = 2;
const SERVICE_H = 52;
const VM_Y = 112;
const LAYER_Y = (() => { let y = VM_Y + 32; return LAYERS.map((l) => { const at = y; y += l.h + 8; return at; }); })();
const VM_H = LAYER_Y[LAYER_Y.length - 1]! + LAYERS[LAYERS.length - 1]!.h + 14 - VM_Y;

// Who ships and patches each layer, per way of running Ruby. Order matches LAYERS.
const OPTIONS: { name: string; config: string; artifact: string; owners: Owner[]; details: string[]; detailMono: boolean[] }[] = [
  { name: "Managed runtime", config: "Runtime: ruby3.4", artifact: "a zip, up to 250 MB", owners: ["aws", "you", "you", "aws", "aws"],
    details: ["AWS's runtime client", "handler.rb", "vendor/bundle", "patched by AWS", "patched by AWS"], detailMono: [false, true, true, false, false] },
  { name: "Container image", config: "FROM ruby:3.4-slim", artifact: "an image, up to 10 GB", owners: ["you", "you", "you", "you", "you"],
    details: ["aws_lambda_ric", "handler.rb", "vendor/bundle", "in your image", "your base image"], detailMono: [true, true, true, false, false] },
  { name: "Custom runtime", config: "Runtime: provided.al2023", artifact: "a zip plus a Ruby layer", owners: ["you", "you", "you", "you", "aws"],
    details: ["your loop", "handler.rb", "vendor/bundle", "a layer in /opt", "patched by AWS"], detailMono: [false, true, true, false, false] },
];
const OWNER_COLOR = { aws: C.lavender, you: C.accent };

// Step-by-step targets: stack x, stack width, then the presence of each step's own panel.
const TARGETS = [
  [col(4), colSpan(4), 1, 0, 0, 0, 1],
  [col(0), colSpan(3), 0, 1, 0, 0, 0],
  [col(0), colSpan(4), 0, 0, 1, 0, 1],
  [col(0), colSpan(4), 0, 0, 0, 1, 1],
];

export function UnderTheHood({ t, step, since }: { t: number; step: number; since: number }) {
  const [sx, sw, pLoop, pOwn, pGems, pRuntime, pService] = useStepTween(TARGETS[step]!, step, since) as number[];
  const loop = loopStage(t);
  const rt = runtimeStage(t);

  // What each layer of the main stack shows right now.
  const glow = (i: number) => {
    if (step === 0) return loop.layers.includes(i) ? 1 : 0;
    if (step === 2) return i === GEMS ? 1 : 0;
    if (step === 3) return (rt.at === "handler" && (i === CODE || i === GEMS)) || i === BOOT ? (i === BOOT ? 0.6 : 1) : 0;
    return 0;
  };
  const owners = OPTIONS[step === 3 ? 2 : 0]!.owners;
  const ownerShow = step === 1 ? pOwn : step === 3 ? pRuntime : 0;
  const gemsBad = step === 2 ? 1 - phase(since, 3.6, 4.2) : 0;

  return (
    <StageScene label="Inside a Lambda copy: a micro VM with Amazon Linux, Ruby, your gems and code, and bootstrap, a loop that asks the Lambda service for the next event, calls your handler and posts the result. Then who owns each layer under the managed runtime, a container image and a custom runtime; how native gems built on a Mac fail on Linux and how to fix each kind; and a custom runtime written in Ruby against the Runtime API.">
      {/* The Lambda service and the two calls the loop makes to it. */}
      <g opacity={pService}>
        <rect x={sx} y={0} width={sw} height={SERVICE_H} fill={C.surface} stroke={step === 0 && loop.at === "arrive" ? C.fg : C.border} />
        <Text x={sx + 14} y={22} size={15} color={C.fg}>Lambda service</Text>
        <Text x={sx + 14} y={41} size={12}>holds the event until bootstrap asks</Text>
        <Wires x={sx + sw} t={t} get={step === 0 ? loop.get : step === 3 ? rt.get : 0.25} post={step === 0 ? loop.post : step === 3 ? rt.post : 0.25} />
      </g>

      <Stack x={sx} w={sw} t={t} glow={glow} owners={owners} ownerShow={ownerShow} compact={sw < 300}
        details={step === 1 ? OPTIONS[0]!.details : step === 3 ? OPTIONS[2]!.details : undefined}
        detailMono={step === 1 ? OPTIONS[0]!.detailMono : step === 3 ? OPTIONS[2]!.detailMono : undefined}
        bad={gemsBad} frozen={step === 0 ? loop.frozen : step === 3 ? rt.frozen : 0} />

      {pLoop > 0.01 && <LoopPanel at={loop.at} opacity={pLoop} />}
      {pOwn > 0.01 && <Ownership t={t} opacity={pOwn} since={step === 1 ? since : 9} />}
      {pGems > 0.01 && <NativeGems opacity={pGems} since={step === 2 ? since : 9} />}
      {pRuntime > 0.01 && <CustomRuntime t={t} opacity={pRuntime} />}
    </StageScene>
  );
}

/* ---------- The copy, as a stack of layers. ---------- */

function Stack({ x, w, glow, owners, ownerShow, compact, details, detailMono, bad, frozen, label = "Firecracker micro VM" }: {
  x: number; w: number; t: number; glow: (i: number) => number; owners: Owner[]; ownerShow: number; compact: boolean;
  details?: string[]; detailMono?: boolean[]; bad: number; frozen: number; label?: string;
}) {
  return (
    <g>
      <rect x={x} y={VM_Y} width={w} height={VM_H} fill="none" stroke={C.fg} strokeOpacity={0.35} />
      <Text x={x + 14} y={VM_Y + 21} size={12}>{label}</Text>
      {frozen > 0 && <Text x={x + w - 14} y={VM_Y + 21} anchor="end" size={12} color={C.cyan} opacity={frozen}>frozen, waiting</Text>}
      {LAYERS.map((l, i) => {
        const y = LAYER_Y[i]!;
        const g = glow(i);
        const owner = owners[i]!;
        const tint = OWNER_COLOR[owner];
        const red = i === GEMS ? bad : 0;
        const detail = details?.[i] ?? l.detail;
        const mono = detailMono?.[i] ?? l.detailMono;
        return (
          <g key={l.name} opacity={1 - frozen * 0.45}>
            <rect x={x + 10} y={y} width={w - 20} height={l.h} fill={C.surface} stroke={red > 0.5 ? C.coral : g > 0.5 ? C.accent : C.border} />
            <rect x={x + 10} y={y} width={w - 20} height={l.h} fill={red > 0.5 ? C.coral : C.accent} opacity={0.14 * Math.max(g, red)} />
            <rect x={x + 10} y={y} width={4} height={l.h} fill={tint} opacity={ownerShow} />
            <rect x={x + 10} y={y} width={w - 20} height={l.h} fill={tint} opacity={0.08 * ownerShow} />
            <Text x={x + 26} y={y + 22} size={15} color={C.fg} mono={l.mono}>{l.name}</Text>
            {!compact || l.h > 40 ? <Text x={x + 26} y={y + 41} size={12} mono={mono}>{compact && detail.length > 30 ? detail.slice(0, 29) + "…" : detail}</Text> : null}
            {ownerShow > 0.01 && <Text x={x + w - 22} y={y + 22} anchor="end" size={12} color={tint} opacity={ownerShow}>{owner === "aws" ? "AWS" : "you"}</Text>}
          </g>
        );
      })}
    </g>
  );
}

/** The two calls bootstrap makes, along the right edge of the stack. */
function Wires({ x, t, get, post }: { x: number; t: number; get: number; post: number }) {
  const top = SERVICE_H;
  const bottom = LAYER_Y[BOOT]! + 18;
  const gx = x - 92, px = x - 40;
  return (
    <g>
      <Flow t={t} on={get} d={`M ${gx} ${top} L ${gx} ${bottom}`} />
      <Flow t={t} on={post} d={`M ${px} ${bottom} L ${px} ${top}`} />
      <Text x={gx - 8} y={top + 30} anchor="end" size={12} mono color={get > 0.5 ? C.accent : C.muted}>GET /next</Text>
      <Text x={px + 8} y={top + 30} size={12} mono color={post > 0.5 ? C.accent : C.muted}>POST</Text>
    </g>
  );
}

/* ---------- Step 1: the loop, narrated on the right. ---------- */

const LOOP_P = 9;
const LOOP = [
  { at: "arrive", from: 0, lines: ["A request reaches the Lambda service."] },
  { at: "get", from: 1.6, lines: ["bootstrap asks for work:", "GET /next, and gets the event."] },
  { at: "handler", from: 3.2, lines: ["It calls your handler with it."] },
  { at: "post", from: 5.0, lines: ["It posts what you returned:", "POST /response."] },
  { at: "wait", from: 6.4, lines: ["It asks again. Until the next event", "arrives, the copy is frozen."] },
] as const;
type LoopAt = (typeof LOOP)[number]["at"];

function loopStage(t: number) {
  const tt = t % LOOP_P;
  let k = 0;
  LOOP.forEach((s, i) => { if (tt >= s.from) k = i; });
  const at = LOOP[k]!.at as LoopAt;
  return {
    at,
    get: at === "get" ? 1 : 0,
    post: at === "post" ? 1 : 0,
    layers: at === "handler" ? [CODE, GEMS, 3] : at === "get" || at === "post" ? [BOOT] : [],
    frozen: at === "wait" ? phase(tt, 6.8, 7.4) * (1 - phase(tt, LOOP_P - 0.3, LOOP_P)) : 0,
  };
}

function LoopPanel({ at, opacity }: { at: LoopAt; opacity: number }) {
  const x = col(8);
  let y = 22;
  return (
    <g opacity={opacity}>
      {LOOP.map((s) => {
        const on = s.at === at;
        const top = y;
        y += s.lines.length * 22 + 22;
        return (
          <g key={s.at}>
            <rect x={x} y={top - 16} width={3} height={s.lines.length * 22} fill={C.accent} opacity={on ? 1 : 0} />
            {s.lines.map((line, k) => <Text key={k} x={x + 18} y={top + k * 22} size={16} color={on ? C.fg : C.muted}>{line}</Text>)}
          </g>
        );
      })}
      <line x1={x} x2={x + colSpan(4)} y1={y + 4} y2={y + 4} stroke={C.border} />
      <Text x={x} y={y + 32} size={16} color={C.fg}>That loop is the runtime.</Text>
      <Text x={x} y={y + 56} size={14}>On a server, Puma runs it over a socket.</Text>
      <Text x={x} y={y + 76} size={14}>On Lambda, bootstrap runs it over local HTTP.</Text>
    </g>
  );
}

/* ---------- Step 2: who owns which layer. ---------- */

function Ownership({ t, opacity, since }: { t: number; opacity: number; since: number }) {
  return (
    <g opacity={opacity}>
      {OPTIONS.map((o, c) => {
        const x = col(c * 3);
        const w = colSpan(3);
        const p = ease(phase(since, 0.2 + c * 0.25, 0.9 + c * 0.25));
        return (
          <g key={o.name}>
            <Text x={x} y={20} size={20} weight={300} color={C.fg}>{o.name}</Text>
            <Text x={x} y={46} size={13} mono color={C.fg}>{o.config}</Text>
            <Text x={x} y={68} size={13}>{o.artifact}</Text>
            {c > 0 && (
              <g opacity={p} transform={`translate(0 ${(1 - p) * 12})`}>
                <Stack x={x} w={w} t={t} glow={() => 0} owners={o.owners} ownerShow={1} compact details={o.details} detailMono={o.detailMono} bad={0} frozen={0} />
              </g>
            )}
          </g>
        );
      })}
      <g opacity={ease(phase(since, 1.0, 1.6))}>
        {[{ c: C.lavender, l: "AWS ships and patches it" }, { c: C.accent, l: "you ship and patch it" }].map((g, k) => (
          <g key={g.l}>
            <rect x={col(9)} y={VM_Y + 8 + k * 26} width={12} height={12} fill={g.c} />
            <Text x={col(9) + 22} y={VM_Y + 19 + k * 26} size={14} color={C.fg}>{g.l}</Text>
          </g>
        ))}
        {[
          ["Start with the managed runtime.", "AWS patches Ruby and Linux."],
          ["Use an image when a gem needs", "system libraries, or you need", "more than 250 MB."],
          ["Write your own runtime when", "nothing else runs your Ruby,", "or your language."],
        ].map((lines, k) => (
          <g key={k}>
            {lines.map((l, j) => <Text key={j} x={col(9)} y={VM_Y + 92 + k * 92 + j * 20} size={14} color={j === 0 ? C.fg : C.muted}>{l}</Text>)}
          </g>
        ))}
      </g>
    </g>
  );
}

/* ---------- Step 3: native gems. ---------- */

const GEMS_ROWS = [
  { gem: "nokogiri", kind: ["ships prebuilt", "binaries"], mac: "nokogiri-1.18.9-arm64-darwin",
    error: ["Could not find nokogiri-1.18.9-", "aarch64-linux-gnu in installed gems"],
    fix: "bundle lock --add-platform aarch64-linux", fixMono: true, why: "Bundler fetches the Linux build too." },
  { gem: "bcrypt", kind: ["compiles C", "on install"], mac: "bcrypt_ext.bundle",
    error: ["LoadError: cannot load such file", "-- bcrypt_ext"],
    fix: "sam build --use-container", fixMono: true, why: "Compile inside a Lambda-like Linux image." },
  { gem: "pg", kind: ["links libpq, a", "system library"], mac: "pg_ext.bundle + libpq.dylib",
    error: ["LoadError: libpq.so.5: cannot open", "shared object file"],
    fix: "Ship libpq in a layer under /opt/lib,", fixMono: false, why: "or build a container image." },
];
const GX = col(4);
const MAC_X = col(5) + 30;
const LAMBDA_X = col(8) + 20;

function NativeGems({ opacity, since }: { opacity: number; since: number }) {
  return (
    <g opacity={opacity}>
      <Text x={MAC_X} y={14} size={13}>bundle install on a Mac</Text>
      <Text x={LAMBDA_X} y={14} size={13}>the same vendor/bundle on Lambda</Text>
      {GEMS_ROWS.map((r, i) => {
        const y = 36 + i * 146;
        const row = ease(phase(since, 0.3 + i * 0.35, 0.8 + i * 0.35));
        const fail = ease(phase(since, 1.4 + i * 0.35, 1.8 + i * 0.35));
        const fixed = ease(phase(since, 3.0 + i * 0.35, 3.5 + i * 0.35));
        return (
          <g key={r.gem} opacity={row} transform={`translate(0 ${(1 - row) * 10})`}>
            <line x1={GX} x2={1152} y1={y} y2={y} stroke={C.border} />
            <Text x={GX} y={y + 28} size={20} color={C.fg} mono>{r.gem}</Text>
            {r.kind.map((l, k) => <Text key={k} x={GX} y={y + 50 + k * 16} size={12}>{l}</Text>)}
            <rect x={MAC_X} y={y + 12} width={LAMBDA_X - MAC_X - 24} height={30} fill={C.surface} stroke={C.border} />
            <Text x={MAC_X + 10} y={y + 32} size={12.5} mono color={C.fg}>{r.mac}</Text>
            <Text x={MAC_X} y={y + 60} size={12}>built for macOS</Text>
            <g opacity={fail * (1 - fixed * 0.6)}>
              {r.error.map((l, k) => <Text key={k} x={LAMBDA_X} y={y + 28 + k * 18} size={12.5} mono color={C.coral}>{l}</Text>)}
            </g>
            <g opacity={fixed}>
              <rect x={MAC_X} y={y + 84} width={10} height={10} fill={C.accent} />
              <Text x={MAC_X + 20} y={y + 94} size={14} mono={r.fixMono} color={C.accent}>{r.fix}</Text>
              <Text x={MAC_X + 20} y={y + 116} size={13}>{r.why}</Text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

/* ---------- Step 4: the runtime, written by hand. ---------- */

const RT_P = 7.2;
const RT = { size: 13, lh: 19 };
const RTC = { x: col(4), y: 0, w: 470 };
const BSC = { x: col(4), y: codeHeight(RUNTIME.length, RT.lh) + 22, w: 470 };
const LOG_X = col(9);
const IDS = ["8f3c", "a91e", "07bd", "5c22"];

function runtimeStage(t: number) {
  const tt = t % RT_P;
  const at = tt < 1.2 ? "get" : tt < 1.8 ? "id" : tt < 3.6 ? "handler" : tt < 4.8 ? "post" : "wait";
  return {
    tt, at,
    line: at === "get" || at === "wait" ? 9 : at === "id" ? 10 : at === "handler" ? 11 : 12,
    get: at === "get" ? 1 : 0,
    post: at === "post" ? 1 : 0,
    frozen: at === "wait" ? phase(tt, 5.0, 5.4) * (1 - phase(tt, RT_P - 0.2, RT_P)) : 0,
  };
}

function CustomRuntime({ t, opacity }: { t: number; opacity: number }) {
  const rt = runtimeStage(t);
  const n = Math.floor(t / RT_P);
  // The log is the HTTP the loop has made so far, newest last; older loops dim.
  const entries: { text: string; dim: boolean; reply?: boolean }[] = [];
  for (let k = Math.max(0, n - 1); k <= n; k++) {
    const id = IDS[k % IDS.length]!;
    const until = k < n ? RT_P : rt.tt;
    const old = k < n;
    if (until >= 0) entries.push({ text: "GET  invocation/next", dim: old });
    if (until >= 1.2) entries.push({ text: `  200  event, id ${id}`, dim: old, reply: true });
    if (until >= 3.6) entries.push({ text: `POST invocation/${id}/response`, dim: old });
    if (until >= 3.9) entries.push({ text: "  202  accepted", dim: old, reply: true });
  }
  const shown = entries.slice(-8);
  return (
    <g opacity={opacity}>
      <Code {...RTC} title="runtime.rb" lines={RUNTIME} size={RT.size} lineH={RT.lh} focus={(i) => (i === rt.line ? 1 : 0)} />
      <Code {...BSC} title="bootstrap" lines={BOOTSTRAP} size={RT.size} lineH={RT.lh} />

      <Text x={LOG_X} y={14} size={14} color={C.fg}>Runtime API, as it happens</Text>
      <Text x={LOG_X} y={34} size={12}>paths under /2018-06-01/runtime/</Text>
      {shown.map((e, i) => (
        <Text key={i} x={LOG_X} y={68 + i * 22} size={12} mono color={e.dim ? C.muted : e.reply ? C.cyan : C.fg} opacity={e.dim ? 0.55 : 1}>{e.text}</Text>
      ))}
      <Text x={LOG_X} y={BSC.y + 20} size={14} color={C.fg}>Three endpoints, a few headers.</Text>
      <Text x={LOG_X} y={BSC.y + 42} size={13}>Any language that speaks HTTP</Text>
      <Text x={LOG_X} y={BSC.y + 60} size={13}>can be a Lambda runtime.</Text>
    </g>
  );
}
