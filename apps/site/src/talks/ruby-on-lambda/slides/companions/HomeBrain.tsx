import { C, Code, StageScene, Text, col, ease, hash, phase, useStepTween } from "./shared";

// After the Mark I Perceptron's wiring figure: sensory units (your home), association units (MCP
// tools in a Ruby Lambda), response units (the assistant, with a 1/0 switch on every action that
// changes something). A conversation plays on a loop and lights the wires each tool call uses.
const P = 14;
const ROW = 46;
const TOP0 = 96;

const DEVICES = [
  { id: "door", label: "front door lock", color: C.coral },
  { id: "temp", label: "living room temperature", color: C.cyan },
  { id: "lights", label: "kitchen and hall lights", color: C.amber },
  { id: "vacuum", label: "robot vacuum", color: C.lavender },
  { id: "nas", label: "NAS backups", color: C.accent },
  { id: "pc", label: "desk PC", color: C.fg },
];
const TOOLS = [
  { id: "read_sensor", write: false, devices: ["door", "temp", "vacuum"] },
  { id: "lock_door", write: true, devices: ["door"] },
  { id: "set_lights", write: true, devices: ["lights"] },
  { id: "start_vacuum", write: true, devices: ["vacuum"] },
  { id: "start_backup", write: true, devices: ["nas"] },
  { id: "wake_pc", write: true, devices: ["pc"] },
];

// The script: who speaks, which tool fires and on which device, and when approval lands.
type Beat = { at: number; who: "you" | "tool" | "ask" | "ok" | "assistant"; text: string; tool?: string; device?: string };
const SCRIPT: Beat[] = [
  { at: 0.2, who: "you", text: "I'm heading out. Make the house safe." },
  { at: 1.4, who: "tool", text: 'read_sensor("front_door") → unlocked', tool: "read_sensor", device: "door" },
  { at: 2.8, who: "ask", text: 'lock_door("front")  Allow?', tool: "lock_door", device: "door" },
  { at: 4.0, who: "ok", text: "approved: locked", tool: "lock_door", device: "door" },
  { at: 5.2, who: "ask", text: 'set_lights("all", "off")  Allow?', tool: "set_lights", device: "lights" },
  { at: 6.2, who: "ok", text: "approved: 4 lights off", tool: "set_lights", device: "lights" },
  { at: 7.2, who: "ask", text: 'start_vacuum("living_room")  Allow?', tool: "start_vacuum", device: "vacuum" },
  { at: 8.2, who: "ok", text: "approved: vacuum started", tool: "start_vacuum", device: "vacuum" },
  { at: 9.4, who: "assistant", text: "Door locked, lights off, vacuum running. Have a good day." },
];

/** Columns per step: [devices x, tools x, responses x], then the presence of each side panel. */
const LAYOUT = [
  [col(4), col(6) + 30, col(8) - 22, 0, 0],
  [col(0), col(2) + 40, col(4) + 30, 1, 0],
  [col(0), col(2) + 40, col(4) + 30, 0, 1],
];

export function HomeBrain({ t, step, since }: { t: number; step: number; since: number }) {
  const [dx, tx, rx, pCode, pGotcha] = useStepTween(LAYOUT[step]!, step, since) as number[];
  const tt = t % P;
  const fade = Math.min(phase(tt, 0, 0.4), 1 - phase(tt, P - 0.6, P));
  let current: Beat | undefined;
  for (const b of SCRIPT) if (tt >= b.at) current = b;
  const live = current && tt - current.at < 1.1 ? 1 - phase(tt - current.at, 0.6, 1.1) : 0;
  const approved = (tool: string) => SCRIPT.some((b) => b.who === "ok" && b.tool === tool && tt >= b.at);
  const asking = (tool: string) => current?.who === "ask" && current.tool === tool;

  const devY = (i: number) => TOP0 + i * ROW;
  const toolY = (i: number) => TOP0 + i * ROW;
  const outY = TOP0 + 2.5 * ROW;
  const chatX = rx! + 64;
  const showChat = step === 0;

  return (
    <StageScene label="A wiring diagram after the Mark I Perceptron. On the left, home devices: a door lock, a temperature sensor, lights, a robot vacuum, a NAS and a desk PC. In the middle, MCP tools running in a Ruby Lambda. On the right, the assistant, with an approve or deny switch for every tool that changes something. A conversation plays: the user asks to make the house safe; the assistant reads the door sensor, asks to lock the door, turn off the lights and start the vacuum, then reports back.">
      <g opacity={fade}>
        {/* Column heads, in the figure's manner. */}
        {[
          { x: dx!, a: "your home", b: "sensory units" },
          { x: tx!, a: "MCP tools on Lambda", b: "association units" },
          { x: rx!, a: "the assistant", b: "response units" },
        ].map((h) => (
          <g key={h.b}>
            <Text x={h.x} y={18} size={13} color={C.fg}>{h.a}</Text>
            <Text x={h.x} y={36} size={12}>{h.b}</Text>
          </g>
        ))}

        {/* The retina: a slanted panel of device units. */}
        <polygon points={`${dx! - 8},${TOP0 - 30} ${dx! + 26},${TOP0 - 44} ${dx! + 26},${devY(5) + 2} ${dx! - 8},${devY(5) + 16}`} fill={C.surface} stroke={C.border} />
        {DEVICES.map((d, i) => {
          const on = current?.device === d.id ? live : 0;
          return (
            <g key={d.id}>
              <rect x={dx! + 2} y={devY(i) - 14 - i * 2} width={14} height={14} fill={d.color} opacity={0.35 + 0.65 * on} />
              <Text x={dx! + 36} y={devY(i) - 2} size={13} color={on > 0.2 ? C.fg : C.muted}>{d.label}</Text>
            </g>
          );
        })}

        {/* Random connections: device → tool. */}
        {TOOLS.flatMap((tool, ti) => tool.devices.map((dev) => {
          const di = DEVICES.findIndex((d) => d.id === dev);
          const on = current?.tool === tool.id && current?.device === dev ? live : 0;
          const x1 = dx! + 16, y1 = devY(di) - 7 - di * 2, x2 = tx! - 6, y2 = toolY(ti) - 6;
          const bend = 40 + hash(ti * 7 + di) * 90;
          return (
            <path key={`${tool.id}-${dev}`} d={`M ${x1} ${y1} C ${x1 + bend} ${y1 - 30 + hash(di + ti) * 60}, ${x2 - bend} ${y2 + 30 - hash(ti * 3) * 60}, ${x2} ${y2}`}
              fill="none" stroke={on ? DEVICES[di]!.color : C.fg} strokeOpacity={0.18 + 0.82 * on} strokeWidth={1 + on * 1.4} />
          );
        }))}

        {/* Association units: the tools, read in green, write in amber. */}
        {TOOLS.map((tool, i) => {
          const on = current?.tool === tool.id ? live : 0;
          return (
            <g key={tool.id}>
              <rect x={tx! - 12} y={toolY(i) - 12} width={12} height={12} fill={tool.write ? C.amber : C.accent} opacity={0.4 + 0.6 * on} />
              <Text x={tx! + 8} y={toolY(i) - 2} size={13} mono color={on > 0.2 ? C.fg : C.muted}>{tool.id}</Text>
              <Text x={tx! + 8} y={toolY(i) + 14} size={11} color={tool.write ? C.amber : C.accent}>{tool.write ? "changes something" : "read only"}</Text>
            </g>
          );
        })}

        {/* Many-to-one: tools → the response units. */}
        {TOOLS.map((tool, i) => {
          const on = current?.tool === tool.id ? live : 0;
          const x1 = tx! + 120, y1 = toolY(i) - 6, x2 = rx! - 4, y2 = tool.write ? TOP0 + (i - 1) * 46 - 6 : outY;
          return <path key={tool.id} d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`} fill="none" stroke={C.fg} strokeOpacity={0.18 + 0.7 * on} strokeWidth={1 + on} />;
        })}

        {/* Response units: an approve/deny switch for every tool that changes something. */}
        {TOOLS.filter((x) => x.write).map((tool, i) => {
          const y = TOP0 + i * 46 - 22;
          const yes = approved(tool.id);
          const ask = asking(tool.id);
          return (
            <g key={tool.id}>
              <rect x={rx!} y={y} width={22} height={32} fill="none" stroke={ask ? C.amber : C.fg} strokeOpacity={ask ? 1 : 0.5} />
              <line x1={rx!} x2={rx! + 22} y1={y + 16} y2={y + 16} stroke={C.fg} strokeOpacity={0.5} />
              <rect x={rx! + 1} y={yes ? y + 1 : y + 17} width={20} height={14} fill={yes ? C.accent : C.border} opacity={yes ? 0.9 : 0.6} />
              <Text x={rx! + 11} y={y + 12} anchor="middle" size={11} color={yes ? C.bg : C.muted}>1</Text>
              <Text x={rx! + 11} y={y + 28} anchor="middle" size={11} color={yes ? C.muted : C.fg}>0</Text>
              <Text x={rx! + 28} y={y + 20} size={11} color={C.muted}>{`R${i + 1}`}</Text>
            </g>
          );
        })}

        {showChat && <Chat x={chatX} tt={tt} />}
      </g>
      {pCode! > 0.01 && <CodePanel opacity={pCode!} />}
      {pGotcha! > 0.01 && <Gotchas opacity={pGotcha!} since={step === 2 ? since : 9} />}
    </StageScene>
  );
}

function Chat({ x, tt }: { x: number; tt: number }) {
  const w = 1152 - x;
  const shown = SCRIPT.filter((b) => tt >= b.at).slice(-7);
  return (
    <g>
      <rect x={x} y={56} width={w} height={330} fill={C.surface} stroke={C.border} />
      <Text x={x + 12} y={74} size={12}>ChatGPT, with your MCP server connected</Text>
      <line x1={x} x2={x + w} y1={84} y2={84} stroke={C.border} />
      {shown.map((b, i) => {
        const y = 110 + i * 38;
        const p = ease(phase(tt - b.at, 0, 0.35));
        const mono = b.who === "tool" || b.who === "ask";
        const color = b.who === "you" ? C.fg : b.who === "assistant" ? C.accent : b.who === "ask" ? C.amber : b.who === "ok" ? C.accent : C.muted;
        const right = b.who === "you";
        return (
          <g key={b.at} opacity={p} transform={`translate(0 ${(1 - p) * 8})`}>
            {(b.who === "you" || b.who === "assistant") && (
              <rect x={right ? x + 30 : x + 10} y={y - 15} width={w - 40} height={24} fill={right ? C.bg : C.surface} stroke={right ? C.border : C.accent} strokeOpacity={0.5} />
            )}
            <Text x={right ? x + 40 : x + 18} y={y + 2} size={mono ? 11.5 : 12.5} mono={mono} color={color}>{trim(b.text, mono ? 46 : 46)}</Text>
          </g>
        );
      })}
    </g>
  );
}
const trim = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const PANEL_X = col(7);

// Verified against the mcp gem 1.8.1 (see the speaker notes).
const SERVER = [
  'require "mcp"',
  "",
  "class LockDoor < MCP::Tool",
  '  tool_name "lock_door"',
  '  description "Lock one door at home"',
  '  input_schema(properties: { door: { type: "string",',
  '    enum: ["front", "back"] } }, required: ["door"])',
  "",
  "  def self.call(door:, server_context:)",
  '    HA.post("/api/services/lock/lock", "lock.#{door}")',
  '    MCP::Tool::Response.new([{ type: "text", text: "locked" }])',
  "  end",
  "end",
  "",
  'server = MCP::Server.new(name: "home", tools: [ReadSensor, LockDoor])',
  "APP = MCP::Server::Transports::StreamableHTTPTransport.new(server,",
  "  stateless: true, enable_json_response: true,",
  '  allowed_hosts: [ENV.fetch("FUNCTION_URL_HOST")])',
];

function CodePanel({ opacity }: { opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${(1 - opacity) * 24} 0)`}>
      <Text x={PANEL_X} y={14} size={14} color={C.accent}>the server: one gem, plain Rack</Text>
      <Code x={PANEL_X} y={28} w={1152 - PANEL_X} title="app.rb" size={12} lineH={19} lines={SERVER} />
      <Text x={PANEL_X} y={466} size={13}>Stateless JSON: no streaming, which the Ruby runtime can't do anyway.</Text>
    </g>
  );
}

const GOTCHAS = [
  { text: ["The URL is public", "ChatGPT can't sign IAM. Use OAuth or its IP ranges"], color: C.coral },
  { text: ["Writes need your approval", "so never mark a lock tool as read-only"], color: C.amber },
  { text: ["Enums, not free text", "a web page the model reads can try to steer it"], color: C.coral },
  { text: ["403 on your first call", "the gem checks Host. Set allowed_hosts"], color: C.amber },
  { text: ["The first call is slow", "container start, then tailscale up, then Ruby"], color: C.amber },
  { text: ["You may not need the Lambda", "Home Assistant has its own MCP server"], color: C.cyan },
];

function Gotchas({ opacity, since }: { opacity: number; since: number }) {
  return (
    <g opacity={opacity}>
      <Text x={PANEL_X} y={14} size={14} color={C.coral}>before you connect it</Text>
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
