import { C, Chip, Code, Flow, Scene, Text, lineY, phase } from "./shared";
import { PUMA_ENV, RACK_APP } from "./code";

const ROW = 26;
const CHIPS = [
  { label: "HTTP request", x: 0, w: 120, mono: false },
  { label: "Puma", x: 150, w: 140, mono: false },
  { label: "env", x: 322, w: 70, mono: true },
  { label: "App#call(env)", x: 424, w: 150, mono: true },
  { label: "[status, headers, body]", x: 606, w: 194, mono: true },
];
const ENV_C = { x: 0, y: 92, w: 380 };
const APP_C = { x: 410, y: 92, w: 390 };
const APPS = ["Rails", "Sinatra", "Roda", "Hanami"];

export function RackContract({ t, step, since }: { t: number; step: number; since: number }) {
  const chipOn = (i: number) => (step === 0 ? (i <= 2 ? 1 : 0.25) : step === 1 ? (i === 3 ? 1 : 0.25) : step === 2 ? (i === 4 ? 1 : 0.25) : i === 1 ? 1 : 0.25);
  const envFocus = (i: number) => (step === 0 ? 1 : step === 1 ? (i === 3 ? 1 : 0) : 0);
  const appFocus = (i: number) => (step === 1 ? ([2, 3, 8].includes(i) ? 1 : 0) : step === 2 ? (i === 4 ? 1 : 0) : 0);
  const swap = step >= 3 ? phase(since, 0.3, 1.0) : 0;
  const appsIn = step >= 3 ? 1 : 0.35;

  return (
    <Scene viewBox="0 0 800 480" label="Puma turns an HTTP request into a Rack env hash, calls the app with it, and gets back status, headers and body. Rails, Sinatra, Roda and Hanami are all Rack apps, so the server can be swapped.">
      {CHIPS.map((c, i) => {
        const swapped = i === 1 && swap > 0;
        return (
          <g key={c.label}>
            <g opacity={swapped ? 1 - swap : 1}><Chip x={c.x} y={ROW - 17} w={c.w} label={c.label} mono={c.mono} color={i === 4 ? C.accent : C.fg} active={chipOn(i)} /></g>
            {swapped && <g opacity={swap}><Chip x={c.x} y={ROW - 17} w={c.w} label="Lambda + mapper" color={C.accent} /></g>}
            {i < CHIPS.length - 1 && <Flow t={t} on={chipOn(i + 1) > 0.5 ? 1 : 0.2} d={`M ${c.x + c.w} ${ROW} L ${CHIPS[i + 1]!.x} ${ROW}`} />}
          </g>
        );
      })}
      <Flow t={t} on={step === 2 ? 1 : 0.15} d={`M ${CHIPS[4]!.x + 97} ${ROW + 17} C ${CHIPS[4]!.x + 97} ${ROW + 46}, ${60} ${ROW + 46}, ${60} ${ROW + 17}`} />
      <Text x={400} y={ROW + 60} anchor="middle" size={12} opacity={step === 2 ? 1 : 0.4}>back out as the HTTP response</Text>

      <Code {...ENV_C} title="what Puma hands the app" lines={PUMA_ENV} focus={envFocus} />
      <Code {...APP_C} title="config.ru" lines={RACK_APP} size={11.5} focus={appFocus} />
      <Flow t={t} on={step === 1 ? 1 : 0} d={`M ${ENV_C.x + ENV_C.w} ${lineY(ENV_C.y, 3)} C ${ENV_C.x + ENV_C.w + 20} ${lineY(ENV_C.y, 3)}, ${APP_C.x - 20} ${lineY(APP_C.y, 3)}, ${APP_C.x} ${lineY(APP_C.y, 3)}`} />

      <g opacity={appsIn} style={{ transition: "opacity .6s" }}>
        <Text x={APP_C.x} y={APP_C.y + 254} size={14} color={C.fg}>all of these are Rack apps</Text>
        {APPS.map((a, i) => <Chip key={a} x={APP_C.x + i * 98} y={APP_C.y + 268} w={88} label={a} color={C.accent} active={step >= 3 ? 1 : 0.4} />)}
        <Text x={APP_C.x} y={APP_C.y + 340} size={14} color={C.accent} opacity={swap}>swap the server, keep the app</Text>
      </g>
    </Scene>
  );
}
