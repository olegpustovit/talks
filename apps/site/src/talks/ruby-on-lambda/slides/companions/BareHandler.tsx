import { C, Code, Flow, StageScene, Text, codeHeight, col, lerp, lineY, phase, useFold, ease } from "./shared";
import { BARE_HANDLER, BARE_RESPONSE, EVENT } from "./code";

// Narrow: the words hold columns 1–4, event and handler share 5–12.
// Wide (from step 2): the title folds away and the request reads left to right
// across the stage, in a bigger size, with room for what Lambda gets back.
const NARROW = { size: 13, lineH: 20, ev: { x: col(4), w: 352 }, hd: { x: col(4) + 384, w: 1152 - col(4) - 384 } };
const WIDE = { size: 15, lineH: 21, ev: { x: 0, w: 400 }, hd: { x: 434, w: 350 }, rs: { x: 818, w: 334 } };
const TOP = 28;

export function BareHandler({ t, step, since }: { t: number; step: number; since: number }) {
  const b = useFold(step >= 1, step, since);
  const size = lerp(NARROW.size, WIDE.size, b);
  const lineH = lerp(NARROW.lineH, WIDE.lineH, b);
  const ev = { x: lerp(NARROW.ev.x, WIDE.ev.x, b), y: TOP, w: lerp(NARROW.ev.w, WIDE.ev.w, b) };
  const hd = { x: lerp(NARROW.hd.x, WIDE.hd.x, b), y: TOP, w: lerp(NARROW.hd.w, WIDE.hd.w, b) };
  // The response column slides in from the right edge as the stage opens up.
  const rs = { x: lerp(1152 + 40, WIDE.rs.x, b), y: TOP, w: WIDE.rs.w };

  // Step 1: the event goes in and one key of it is read. Step 2: the hash comes back out.
  const eventFocus = (i: number) => (step === 0 ? (i === 2 ? 1 : 0.35) : 0);
  const handlerFocus = (i: number) => (step === 0 ? (i === 3 || i === 4 ? 1 : 0) : i >= 5 && i <= 11 ? 1 : 0);
  const typed = step >= 1 ? Math.floor(ease(phase(since, 0.6, 1.6)) * BARE_RESPONSE.length + 0.001) : 0;
  const rsH = codeHeight(BARE_RESPONSE.length, lineH);

  const header = (x: number, label: string, on: boolean, mono?: boolean) => (
    <Text x={x} y={14} size={14} color={on ? C.accent : C.muted} mono={mono}>{label}</Text>
  );

  return (
    <StageScene label="A Lambda function URL event in JSON, the Ruby handler method that reads it, and the plain hash it returns, which Lambda turns into the HTTP response.">
      {header(ev.x, "the event Lambda sends", step === 0)}
      {header(hd.x, "your method", step === 0)}
      <g opacity={b}>{header(rs.x, "the hash it returns", step === 1)}</g>

      <Code x={ev.x} y={ev.y} w={ev.w} title="event.json" lines={EVENT} lang="json" focus={eventFocus} size={size} lineH={lineH} />
      <Code x={hd.x} y={hd.y} w={hd.w} title="handler.rb" lines={BARE_HANDLER} focus={handlerFocus} size={size} lineH={lineH} />

      {/* Step 1: the whole event is the argument. Step 2: one key of it is the order id. */}
      <Flow t={t} on={step === 0 ? 1 : 0} d={curve(ev.x + ev.w, ev.y + 11, hd.x, lineY(hd.y, 3, lineH))} />
      <Flow t={t} on={step === 0 ? 1 : 0} d={curve(ev.x + ev.w, lineY(ev.y, 2, lineH), hd.x, lineY(hd.y, 4, lineH))} />

      {/* What Lambda gets back: an empty card waits in the new column until the method returns. */}
      <g opacity={b}>
        <rect x={rs.x} y={rs.y} width={rs.w} height={rsH} fill="none" stroke={C.border} strokeDasharray={step >= 1 ? undefined : "2 6"} />
        {step >= 1 && <Code x={rs.x} y={rs.y} w={rs.w} title="response" lines={BARE_RESPONSE} lang="json" size={size} lineH={lineH} shown={typed} />}
        {step < 1 && <Text x={rs.x + 12} y={rs.y + 15} size={12} mono>response</Text>}
        <Flow t={t} on={step === 1 ? 1 : 0} d={curve(hd.x + hd.w, lineY(hd.y, 5, lineH), rs.x, lineY(rs.y, 0, lineH))} />
      </g>
      <g opacity={step >= 1 ? phase(since, 1.6, 2.1) : 0}>
        <Text x={rs.x} y={rs.y + rsH + 32} size={15} color={C.fg}>Lambda turns this into</Text>
        <Text x={rs.x} y={rs.y + rsH + 54} size={15} color={C.fg}>the HTTP response.</Text>
        <Text x={rs.x} y={rs.y + rsH + 84} size={13}>No server, no framework.</Text>
        <Text x={rs.x} y={rs.y + rsH + 102} size={13}>This file loads in milliseconds.</Text>
      </g>
    </StageScene>
  );
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const k = Math.max(16, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`;
};
