import { C, Code, Scene, Text, phase } from "./shared";
import { MAPPER_ENV, MAPPER_RESPONSE } from "./code";

const LH = 15.5;
const ENV_C = { x: 0, y: 14, w: 470 };
const RES_C = { x: 500, y: 14, w: 300 };
const NOTE = { x: 500, y: 262 };

const STEPS = [
  {
    lines: [7, 10], title: "Read the event",
    notes: ["Function URLs send payload format 2.0.", "Binary bodies arrive base64-encoded,", "so decode them before Rack sees them."],
    examples: ['"isBase64Encoded": true → decode64'],
  },
  {
    lines: [12, 23], title: "Fill in what Rack requires",
    notes: ["The Rack spec names the keys every app", "may rely on. On Lambda, the port, scheme", "and protocol never change."],
    examples: ['rawPath → "PATH_INFO"', 'method  → "REQUEST_METHOD"'],
  },
  {
    lines: [24, 28], title: "Headers become HTTP_*",
    notes: ["Upcase, dashes to underscores, prefix.", "Content-Type and Content-Length", "keep their CGI names."],
    examples: ['"accept"       → "HTTP_ACCEPT"', '"x-request-id" → "HTTP_X_REQUEST_ID"', '"content-type" → "CONTENT_TYPE"'],
  },
  {
    lines: [-1, -1], title: "The triple becomes a hash",
    notes: ["Read the body, close it if it can be,", "and hand Lambda statusCode, headers,", "body. That's the whole adapter."],
    examples: ["[200, {…}, [\"…\"]] → { statusCode: 200, … }"],
  },
];

export function Mapper({ step, since }: { t: number; step: number; since: number }) {
  const s = STEPS[Math.min(step, STEPS.length - 1)]!;
  const inFocus = (i: number) => (i >= s.lines[0]! && i <= s.lines[1]! ? 1 : 0);
  const resFocus = () => (step === 3 ? 1 : 0);
  const appear = phase(since, 0, 0.45);

  return (
    <Scene viewBox="0 0 800 540" label="The full mapper module, about forty lines of Ruby, walked through in four parts: read the event, fill in the Rack keys, turn headers into HTTP_ keys, and turn the Rack response into a Lambda response hash.">
      <Code {...ENV_C} title="lambda_rack.rb" lines={MAPPER_ENV} size={11.5} lineH={LH} focus={inFocus} />
      <Code {...RES_C} title="lambda_rack.rb, continued" lines={MAPPER_RESPONSE} size={11.5} lineH={LH} focus={step === 3 ? resFocus : () => 0} />

      <g opacity={appear} transform={`translate(0 ${(1 - appear) * 8})`}>
        <Text x={NOTE.x} y={NOTE.y} size={12} color={C.accent}>{`${step + 1} / 4`}</Text>
        <Text x={NOTE.x} y={NOTE.y + 28} size={20} color={C.fg}>{s.title}</Text>
        {s.notes.map((n, i) => <Text key={i} x={NOTE.x} y={NOTE.y + 58 + i * 20} size={14}>{n}</Text>)}
        <line x1={NOTE.x} x2={RES_C.x + RES_C.w} y1={NOTE.y + 132} y2={NOTE.y + 132} stroke={C.border} />
        {s.examples.map((e, i) => <Text key={i} x={NOTE.x} y={NOTE.y + 156 + i * 22} size={12.5} color={C.fg} mono>{e}</Text>)}
      </g>
      <Text x={RES_C.x + RES_C.w} y={530} anchor="end" size={13}>{`${MAPPER_ENV.length + MAPPER_RESPONSE.length} lines of Ruby`}</Text>
    </Scene>
  );
}
