import { C, Code, Flow, StageScene, Text, charW, codeHeight, lineY, phase } from "./shared";
import { EVENT, LAMBDA_ENV } from "./code";

// One field at a time, on a loop: where each Rack key comes from in the Lambda event.
// The Ruby that does the copy sits on the wire between them, in the middle of the stage.
export const EVENT_ENV_H = 426;
const SIZE = 15;
const LH = 21;
const EV = { x: 0, y: 4, w: 400 };
const EN = { x: 1152 - 360, y: 4, w: 360 };
const MID = (EV.x + EV.w + EN.x) / 2;
const PAIRS: { from: number | null; to: number[]; how: string }[] = [
  { from: 11, to: [1], how: 'http["method"]' },
  { from: 2, to: [3], how: 'event["rawPath"]' },
  { from: 3, to: [4], how: 'event["rawQueryString"]' },
  { from: 6, to: [5], how: 'headers["host"]' },
  { from: 5, to: [8], how: '"HTTP_" + name.upcase.tr("-", "_")' },
  { from: 15, to: [10], how: "StringIO.new(body)" },
  { from: null, to: [2, 6, 7, 9], how: "the same on every Lambda request" },
];
const BEAT = 1.8;

export function EventToEnv({ t }: { t: number }) {
  const k = Math.floor(t / BEAT) % PAIRS.length;
  const u = (t % BEAT) / BEAT;
  const pair = PAIRS[k]!;
  const glow = Math.min(phase(u, 0, 0.12), 1 - phase(u, 0.88, 1));
  const evFocus = (i: number) => (pair.from === i ? glow : 0);
  const enFocus = (i: number) => (pair.to.includes(i) ? glow : 0);
  const y1 = pair.from === null ? EN.y + codeHeight(LAMBDA_ENV.length, LH) / 2 : lineY(EV.y, pair.from, LH);
  const y2 = lineY(EN.y, pair.to[0]!, LH);
  // The label rides between the two lines it connects, and eases there rather than jumping.
  const ly = (y1 + y2) / 2;
  const code = pair.from !== null;
  const tw = pair.how.length * (code ? charW(18) : 9);

  return (
    <StageScene h={EVENT_ENV_H} label="The Lambda event on the left and the Rack env on the right; one by one, each env key lights up with the event field it comes from, and the Ruby expression that maps it sits on the connector between them.">
      <Code {...EV} title="Lambda event" lines={EVENT} lang="json" focus={evFocus} size={SIZE} lineH={LH} />
      <Code {...EN} title="Rack env" lines={LAMBDA_ENV} focus={enFocus} size={SIZE} lineH={LH} />

      {PAIRS.map((p, i) => p.from === null ? null : (
        <Flow key={i} t={t} on={i === k ? glow : 0}
          d={`M ${EV.x + EV.w} ${lineY(EV.y, p.from, LH)} C ${MID} ${lineY(EV.y, p.from, LH)}, ${MID} ${lineY(EN.y, p.to[0]!, LH)}, ${EN.x} ${lineY(EN.y, p.to[0]!, LH)}`} />
      ))}

      <g opacity={glow}>
        <rect x={MID - tw / 2 - 14} y={ly - 40} width={tw + 28} height={64} fill={C.bg} />
        <Text x={MID} y={ly - 18} anchor="middle" size={13}>{code ? "mapped by" : "constants"}</Text>
        <Text x={MID} y={ly + 8} anchor="middle" size={18} color={C.fg} mono={code}>{pair.how}</Text>
      </g>

      {/* Where we are in the loop: one tick per Rack key group. */}
      {PAIRS.map((_, i) => (
        <rect key={i} x={MID - (PAIRS.length * 18) / 2 + i * 18} y={EVENT_ENV_H - 14} width={12} height={4}
          fill={i === k ? C.accent : C.border} />
      ))}
    </StageScene>
  );
}
