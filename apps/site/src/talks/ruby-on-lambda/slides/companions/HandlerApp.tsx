import { C, Code, Flow, StageScene, Text, col, colSpan, ease, lineY, phase } from "./shared";
import { HANDLER, SINATRA_APP } from "./code";

// One slow loop, about sixteen seconds, on the grid: handler.rb on columns 1–4, app.rb on 5–8,
// column 9 left empty, the chart on 10–12. A copy starts and loads the app once while the chart
// races a Rails boot against it; then a few requests pass through the handler's three lines.
export const HANDLER_H = 421;
const P = 16;
const SIZE = 14;
const LH = 20;
const HD = { x: col(0), y: 0, w: colSpan(4) };
const AP = { x: col(4), y: 0, w: colSpan(4) };
const CX = col(9);
const CW = colSpan(3);

const INIT = { from: 0.8, to: 5.2 }; // 2,810 ms of Rails drawn over 4.4 s
const REQ = { from: 6.4, every: 1.5, count: 5 };
const BARS = [{ label: "Rails app", ms: 2810, color: C.coral }, { label: "Sinatra + Sequel", ms: 620, color: C.accent }];
const MAX_MS = 2900;
const WARM_MS = [31, 24, 28, 22, 26];

export function HandlerApp({ t }: { t: number }) {
  const tt = t % P;
  const fade = Math.min(phase(tt, 0, 0.6), 1 - phase(tt, P - 0.8, P));
  const reqT = tt - REQ.from;
  const req = reqT >= 0 ? Math.floor(reqT / REQ.every) : -1;
  const live = req >= 0 && req < REQ.count;
  const u = live ? (reqT % REQ.every) / REQ.every : 0;
  // Within one request: env (line 7), call (line 8 and the route), response (line 9), then a rest.
  const beat = u < 0.25 ? 7 : u < 0.5 ? 8 : u < 0.75 ? 9 : -1;
  const served = req < 0 ? 0 : Math.min(REQ.count, req + (u >= 0.75 ? 1 : 0));
  const init = reqT < -0.4;

  const hdFocus = (i: number) => (init ? ([1, 2, 4].includes(i) ? 1 : 0) : live && i === beat ? 1 : 0);
  const apFocus = (i: number) => (init ? (i >= 1 && i <= 7 ? 1 : 0) : live && beat === 8 && i >= 8 && i <= 10 ? 1 : 0);
  const ms = ease(phase(tt, INIT.from, INIT.to)) * BARS[0]!.ms;
  const x = (v: number) => (v / MAX_MS) * CW;
  const status = init ? "A new copy starts. Everything outside the method runs once." : live ? `Request ${req + 1}: event → env → app → response.` : "Warm copy, waiting for the next request.";

  return (
    <StageScene h={HANDLER_H} label="A slow loop. A new Lambda copy loads the mapper and a small Sinatra app once, while a chart races a Rails cold start against the small app's. Then requests pass through the handler's three lines, each in a few milliseconds.">
      <g opacity={fade}>
        <Code {...HD} title="handler.rb" lines={HANDLER} size={SIZE} lineH={LH} focus={hdFocus} />
        <Code {...AP} title="app.rb" lines={SINATRA_APP} size={SIZE} lineH={LH} focus={apFocus} />
        <Flow t={t} on={live && beat === 8 ? 1 : 0} d={`M ${HD.x + HD.w} ${lineY(HD.y, 8, LH)} C ${HD.x + HD.w + 14} ${lineY(HD.y, 8, LH)}, ${AP.x - 14} ${lineY(AP.y, 8, LH)}, ${AP.x} ${lineY(AP.y, 8, LH)}`} />

        {/* The chart: the boot race, then the warm requests on the same scale. */}
        <Text x={CX} y={14} size={14} color={C.fg}>Cold start, once per copy*</Text>
        {BARS.map((b, i) => {
          const y = 44 + i * 72;
          const v = Math.min(ms, b.ms);
          return (
            <g key={b.label}>
              <Text x={CX} y={y + 14} size={14} color={ms >= b.ms ? C.fg : C.muted}>{b.label}</Text>
              <Text x={CX + CW} y={y + 14} anchor="end" size={14} color={b.color}>{`${Math.round(v).toLocaleString("en-US")} ms`}</Text>
              <rect x={CX} y={y + 24} width={CW} height={20} fill="none" stroke={C.border} />
              <rect x={CX} y={y + 24} width={x(v)} height={20} fill={b.color} opacity={0.85} />
            </g>
          );
        })}
        <Text x={CX} y={226} size={14} color={C.fg}>Then each request</Text>
        {WARM_MS.map((w, i) => {
          const y = 244 + i * 20;
          const on = i < served;
          return (
            <g key={i} opacity={on ? 1 : 0.3}>
              <rect x={CX} y={y} width={Math.max(2, x(w))} height={12} fill={on ? C.accent : C.border} />
              {on && <Text x={CX + 12} y={y + 11} size={13}>{`${w} ms`}</Text>}
            </g>
          );
        })}

        <line x1={0} x2={1152} y1={HANDLER_H - 32} y2={HANDLER_H - 32} stroke={C.border} />
        <Text x={0} y={HANDLER_H - 6} size={15} color={C.fg}>{status}</Text>
      </g>
    </StageScene>
  );
}
