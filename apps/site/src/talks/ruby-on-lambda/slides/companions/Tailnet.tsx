import { C, Code, StageScene, Text, col, ease, phase, useStepTween } from "./shared";
import { Box, Plane, makeIso, type P3 } from "./iso";

// An exploded stack, after isometric routing drawings: AWS on top with Lambda copies, the tailnet
// as coloured WireGuard routes in the middle, your home on the bottom grid. A phone on the public
// internet comes in from the left. Step 1 traces one request through it on a loop; step 2 opens
// one copy to show what runs inside; step 3 pins the gotchas where they happen.
const U = 28;
const TOP = 6.5; // AWS plane height, in units
const MID = 3.2; // the tailnet routing layer
const W = 10, D = 7;

const COPIES = [{ x: 1.4, y: 1.5 }, { x: 4.2, y: 1.5 }, { x: 7.0, y: 1.5 }];
const COPY = { w: 1.8, d: 1.8, h: 1.2 };
const URL_GATE = { x: 0.8, y: 5.0, w: 1.3, d: 1.3, h: 0.45 };
const DEVICES = [
  { id: "ha", label: "Home Assistant", x: 1.0, y: 1.0, w: 2.4, d: 2.2, h: 1.1, color: C.cyan },
  { id: "nas", label: "NAS", x: 6.0, y: 0.9, w: 2.4, d: 1.8, h: 2.0, color: C.lavender },
  { id: "pi", label: "Raspberry Pi", x: 1.8, y: 4.7, w: 1.5, d: 1.1, h: 0.5, color: C.amber },
  { id: "laptop", label: "your laptop", x: 6.2, y: 4.5, w: 2.4, d: 1.7, h: 0.28, color: C.accent },
];
const DERP = { x: 11.6, y: 3.2, w: 0.9, d: 0.9, h: 0.9 };
const PHONE = { x: -2.2, y: 1.8, w: 0.7, d: 0.25, h: 1.3 };

// Each copy's tunnel: down from the copy, along the routing layer, down onto a device.
const centre = (b: { x: number; y: number; w: number; d: number }) => [b.x + b.w / 2, b.y + b.d / 2] as const;
function tunnel(c: { x: number; y: number }, dev: (typeof DEVICES)[number], lane: number): P3[] {
  const [cx, cy] = [c.x + COPY.w / 2, c.y + COPY.d / 2];
  const [dx, dy] = centre(dev);
  return [[cx, cy, TOP], [cx, cy, MID + lane * 0.3], [dx, cy, MID + lane * 0.3], [dx, dy, MID + lane * 0.3], [dx, dy, dev.h]];
}
const ROUTES = [
  { from: 0, to: 0, lane: 0 }, { from: 1, to: 1, lane: 1 }, { from: 2, to: 3, lane: 2 }, { from: 0, to: 2, lane: 3 },
];

/** Where the stack sits per step: narrow on columns 5–12, then moved left to make room for a panel. */
const ORIGIN = [[870, 232], [250, 232], [250, 232]];

export function Tailnet({ t, step, since }: { t: number; step: number; since: number }) {
  const [ox, oy, pPanel1, pPanel2] = useStepTween([...ORIGIN[step]!, step === 1 ? 1 : 0, step === 2 ? 1 : 0], step, since) as number[];
  const iso = makeIso(ox!, oy!, U);
  // The entrance, on the slide's clock: the home grid takes over from the landing poster, devices
  // rise, tunnels draw, AWS settles from above, then the phone appears and the request loop starts.
  const home = 1, rise = 1, tunnels = 1, aws = 1, phone = 1;
  const loop = (t % 6.4) / 6.4;
  // The traced request: phone → URL → copy 1 → its tunnel → Home Assistant → and back.
  const leg = (a: number, b: number) => (step === 0 ? phase(loop, a, b) : 1);
  const haGlow = step === 0 ? Math.min(phase(loop, 0.5, 0.56), 1 - phase(loop, 0.7, 0.8)) : 0;
  const copyGlow = step === 0 ? Math.min(phase(loop, 0.2, 0.26), 1 - phase(loop, 0.85, 0.95)) : step === 1 ? 1 : 0;

  const tracePhone: P3[] = [[PHONE.x + PHONE.w / 2, PHONE.y, TOP + 0.6], [URL_GATE.x, URL_GATE.y + URL_GATE.d / 2, TOP + 0.6], [URL_GATE.x + URL_GATE.w / 2, URL_GATE.y + URL_GATE.d / 2, TOP + URL_GATE.h]];
  const traceGate: P3[] = [[URL_GATE.x + URL_GATE.w / 2, URL_GATE.y, TOP + URL_GATE.h], [COPIES[0]!.x + COPY.w / 2, COPIES[0]!.y + COPY.d, TOP + 0.2]];

  return (
    <StageScene label="An exploded isometric stack. On top, an AWS region with three Lambda copies and a Function URL. In the middle, the tailnet: coloured WireGuard routes and a DERP relay. At the bottom, a home network with Home Assistant, a NAS, a Raspberry Pi and a laptop. A request from a phone on the internet enters the Function URL, reaches a Lambda copy, and travels through the tailnet to Home Assistant.">
      {/* Corner posts tying the layers together. */}
      {([[0, 0], [W, 0], [W, D], [0, D]] as const).map(([x, y], i) => (
        <path key={i} d={iso.path([[x, y, 0], [x, y, TOP]])} stroke={C.muted} strokeOpacity={0.5 * tunnels} strokeDasharray="3 5" />
      ))}

      <g opacity={home}>
        <Plane iso={iso} x0={0} y0={0} w={W} d={D} z={0} />
        <Label at={step === 0 ? iso.at([0, D, 0]) : iso.at([W, 0, 0])} dx={step === 0 ? -16 : 16} text="your home" sub="no open ports" />
      </g>
      {DEVICES.map((d, i) => {
        const up = ease(phase(rise, i * 0.12, 0.6 + i * 0.12));
        return up > 0.01 && (
          <g key={d.id}>
            <Box iso={iso} {...d} h={d.h * up} z={0} color={d.color} glow={d.id === "ha" ? haGlow : 0} />
          </g>
        );
      })}

      {/* The tailnet: one colour per tunnel, drawn as orthogonal routes on their own layer. */}
      {ROUTES.map((r, i) => {
        const dev = DEVICES[r.to]!;
        const pts = tunnel(COPIES[r.from]!, dev, r.lane);
        const traced = i === 0 && step === 0;
        return (
          <g key={i}>
            <path d={iso.path(pts)} fill="none" stroke={dev.color} strokeOpacity={traced ? 0.35 : 0.75} strokeWidth={1.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease(phase(tunnels, i * 0.15, 0.55 + i * 0.15))} />
            {traced && <path d={iso.path(pts)} fill="none" stroke={dev.color} strokeWidth={2.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - leg(0.26, 0.5) + phase(loop, 0.8, 0.95)} />}
          </g>
        );
      })}
      <g opacity={tunnels}>
      <Label at={step === 0 ? iso.at([0, D, MID]) : iso.at([W, 0, MID])} dx={step === 0 ? -16 : 16} text="the tailnet" sub="WireGuard, end to end" />

      {/* The DERP relay: where traffic goes when the two ends can't reach each other directly. */}
      <Box iso={iso} {...DERP} z={MID - 0.45} color={C.coral} wire glow={step === 2 ? 0.6 + 0.4 * Math.sin(t * 4) : 0} />
      <DeviceTag at={iso.at([DERP.x + DERP.w, DERP.y, MID + 0.45])} text="DERP relay" color={C.coral} />
      <path d={iso.path([[COPIES[2]!.x + COPY.w / 2, COPIES[2]!.y + COPY.d / 2, TOP], [DERP.x + DERP.w / 2, COPIES[2]!.y + COPY.d / 2, MID + 0.2], [DERP.x + DERP.w / 2, DERP.y, MID + 0.2]])}
        fill="none" stroke={C.coral} strokeOpacity={step === 2 ? 0.9 : 0.3} strokeDasharray="4 4" />
      </g>

      {/* AWS settles from above. */}
      <g opacity={aws} transform={`translate(0 ${-(1 - aws) * 60})`}>
      <Plane iso={iso} x0={0} y0={0} w={W} d={D} z={TOP} fill={C.surface} opacity={0.96} />
      <Label at={step === 0 ? iso.at([0, D, TOP]) : iso.at([W, 0, TOP])} dx={step === 0 ? -16 : 16} text="AWS, eu-central-1" sub="Lambda copies come and go" />
      <Box iso={iso} {...URL_GATE} z={TOP} color={C.fg} wire glow={step === 0 ? Math.min(phase(loop, 0.08, 0.14), 1 - phase(loop, 0.9, 1)) : 0} />
      <DeviceTag at={iso.at([URL_GATE.x, URL_GATE.y + URL_GATE.d, TOP + URL_GATE.h])} text="Function URL" color={C.fg} left />
      {COPIES.map((c, i) => (
        <g key={i}>
          <Box iso={iso} x={c.x} y={c.y} z={TOP} {...COPY} color={C.accent} wire glow={i === 0 ? copyGlow : 0.15} />
          <Text x={iso.at([c.x + COPY.w / 2, c.y + COPY.d / 2, TOP + COPY.h])[0]} y={iso.at([c.x + COPY.w / 2, c.y + COPY.d / 2, TOP + COPY.h])[1] + 4} anchor="middle" size={12} color={C.accent}>λ</Text>
        </g>
      ))}

      </g>

      {/* The public internet. */}
      <g opacity={phone}>
      <Box iso={iso} {...PHONE} z={TOP} color={C.fg} wire />
      <DeviceTag at={iso.at([PHONE.x, PHONE.y + PHONE.d, TOP + PHONE.h])} text="a phone, anywhere" color={C.fg} left />
      <path d={iso.path(tracePhone)} fill="none" stroke={C.fg} strokeOpacity={0.3} />
      <path d={iso.path(traceGate)} fill="none" stroke={C.fg} strokeOpacity={0.3} />
      {step === 0 && (
        <g>
          <path d={iso.path(tracePhone)} fill="none" stroke={C.fg} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - leg(0.0, 0.12) + phase(loop, 0.9, 1)} />
          <path d={iso.path(traceGate)} fill="none" stroke={C.fg} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - leg(0.12, 0.22) + phase(loop, 0.88, 0.98)} />
        </g>
      )}

      </g>

      {/* Tags last, so the AWS plane never sits over a home device's name. */}
      <g opacity={ease(phase(rise, 0.6, 1))}>
        {DEVICES.map((d) => <DeviceTag key={d.id} at={iso.at([d.x + d.w, d.y, d.h])} text={d.label} color={d.color} />)}
      </g>

      {pPanel1 > 0.01 && <InsideCopy opacity={pPanel1} />}
      {pPanel2 > 0.01 && <Gotchas opacity={pPanel2} since={step === 2 ? since : 9} />}
      {step === 0 && <g opacity={phone}><Request loop={loop} /></g>}
    </StageScene>
  );
}

function Label({ at, dx, text, sub }: { at: [number, number]; dx: number; text: string; sub: string }) {
  return (
    <g>
      <Text x={at[0] + dx} y={at[1] + 4} size={14} color={C.fg} anchor={dx < 0 ? "end" : "start"}>{text}</Text>
      <Text x={at[0] + dx} y={at[1] + 21} size={12} anchor={dx < 0 ? "end" : "start"}>{sub}</Text>
    </g>
  );
}

function DeviceTag({ at, text, color, left }: { at: [number, number]; text: string; color: string; left?: boolean }) {
  const w = text.length * 6.4 + 14;
  const x = left ? at[0] - w - 10 : at[0] + 10;
  return (
    <g>
      <path d={`M ${at[0]} ${at[1]} L ${left ? x + w : x} ${at[1] - 14}`} stroke={color} strokeOpacity={0.6} />
      <rect x={x} y={at[1] - 24} width={w} height={18} fill={C.bg} stroke={color} strokeOpacity={0.6} />
      <Text x={x + 7} y={at[1] - 11} size={12} color={C.fg}>{text}</Text>
    </g>
  );
}

/** Step 1's caption: what the traced request is doing right now. */
function Request({ loop }: { loop: number }) {
  const lines = [
    { at: 0, text: "you tap Start vacuum on your phone, away from home" },
    { at: 0.12, text: "the Function URL wakes a Lambda copy" },
    { at: 0.26, text: "the copy reaches your home over the tailnet" },
    { at: 0.5, text: "Home Assistant starts the vacuum" },
    { at: 0.72, text: "the reply comes back the same way" },
  ];
  let k = 0;
  lines.forEach((l, i) => { if (loop >= l.at) k = i; });
  return (
    <g>
      {lines.map((l, i) => (
        <g key={i}>
          <rect x={col(4)} y={354 + i * 24} width={3} height={16} fill={C.accent} opacity={i === k ? 1 : 0} />
          <Text x={col(4) + 14} y={367 + i * 24} size={14} color={i === k ? C.fg : C.muted}>{l.text}</Text>
        </g>
      ))}
    </g>
  );
}

const PANEL_X = col(7);

function InsideCopy({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${(1 - opacity) * 24} 0)`}>
      <Text x={PANEL_X} y={14} size={14} color={C.accent}>inside one copy</Text>
      <Code x={PANEL_X} y={28} w={1152 - PANEL_X} title="bootstrap" lang="text" size={12.5} lineH={19} lines={BOOTSTRAP} />
      <Code x={PANEL_X} y={28 + 30 + BOOTSTRAP.length * 19 + 10 + 18} w={1152 - PANEL_X} title="handler.rb" size={12.5} lineH={19} lines={HANDLER} />
      <Text x={PANEL_X} y={466} size={13}>A Tailscale Lambda extension can do the same during init.</Text>
    </g>
  );
}

// From Tailscale's Lambda guide (KB 1113), with the HTTP proxy (KB 1112) so plain Net::HTTP works.
export const BOOTSTRAP = [
  "#!/bin/sh",
  "# Lambda has no /dev/net/tun: run Tailscale in userspace",
  "tailscaled --tun=userspace-networking --state=mem: \\",
  "  --socks5-server=localhost:1055 \\",
  "  --outbound-http-proxy-listen=localhost:1055 &",
  "tailscale up --auth-key=$TS_AUTHKEY --hostname=lambda",
  "exec ruby runtime.rb",
];
export const HANDLER = [
  "# MagicDNS names resolve through the proxy",
  'HOME = ["homeassistant", 8123, "localhost", 1055]',
  "",
  "def handler(event:, context:)",
  "  http = Net::HTTP.new(*HOME)",
  '  res = http.post("/api/services/vacuum/start",',
  "    VACUUM, HA_HEADERS)",
  "  { statusCode: res.code.to_i, body: res.body }",
  "end",
];

const GOTCHAS = [
  { text: ["Slower cold starts", "tailscaled has to start and log in during init"], color: C.coral },
  { text: ["Extra latency", "traffic often goes through a DERP relay"], color: C.coral },
  { text: ["One tailnet node per copy", "the free plan gives 1,000 ephemeral minutes a month"], color: C.amber },
  { text: ["A slow first request after a pause", "the copy was frozen, so the tunnel reconnects"], color: C.amber },
  { text: ["Anyone with the URL can call it", "with AuthType NONE. Check a signature in Ruby"], color: C.coral },
  { text: ["Limit what the Lambda can reach", "tag the key, allow only homeassistant:8123"], color: C.cyan },
];

function Gotchas({ opacity, since }: { opacity: number; since: number }) {
  return (
    <g opacity={opacity}>
      <Text x={PANEL_X} y={14} size={14} color={C.coral}>the catches</Text>
      {GOTCHAS.map((g, k) => {
        const p = ease(phase(since, 0.4 + k * 0.18, 0.9 + k * 0.18));
        const y = 46 + k * 66;
        return (
          <g key={k} opacity={p} transform={`translate(${(1 - p) * 12} 0)`}>
            <rect x={PANEL_X} y={y - 13} width={20} height={16} fill={g.color} />
            <Text x={PANEL_X + 10} y={y} anchor="middle" size={11} color={C.bg}>{String(k + 1)}</Text>
            {g.text.map((l, j) => <Text key={j} x={PANEL_X + 34} y={y + j * 19} size={j ? 13 : 15} color={j ? C.muted : C.fg}>{l}</Text>)}
          </g>
        );
      })}
    </g>
  );
}
