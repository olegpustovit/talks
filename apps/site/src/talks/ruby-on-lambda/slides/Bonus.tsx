import { useEffect, useRef } from "react";
import { Slide, SpeakerNote, useSlideIsActive } from "@talks/slide-engine";

// The bonus divider, after the MIT Lincoln Laboratory poster, reeded glass and the heat-wave
// prints: a domain-warped colour field in the deck's own hues, cut into tiles that each act as a
// small inverted lens, woven from vertical threads, dithered, with the odd column slipping up or down.
// Nothing else on the slide: the field fills the stage and the word sits in the middle.
// One WebGL pass; drawn at CSS resolution (the look is coarse on purpose) and at most 30 fps.

// Seven ramp stops per palette. Each stop keeps only the hue of a theme token and sets its own
// saturation and lightness, so the divider uses the deck's colours at poster strength.
// Nothing reaches white: the brightest stop is a light, saturated colour.
type Stop = [token: string, saturation: number, lightness: number];
// A palette is one ramp, or two (warm, cool) that the field splits into regions.
const PALETTES: Record<string, [Stop[], Stop[]?]> = {
  // Purple ground; warm pools run red into yellow, cool pools run into cyan.
  prism: [
    [["--se-diagram-lavender", 0.55, 0.08], ["--se-diagram-lavender", 0.6, 0.19], ["--se-diagram-coral", 0.78, 0.38], ["--se-diagram-coral", 0.85, 0.5], ["--se-diagram-amber", 0.88, 0.57], ["--se-diagram-amber", 0.92, 0.66], ["--se-diagram-amber", 0.9, 0.75]],
    [["--se-diagram-lavender", 0.55, 0.08], ["--se-diagram-lavender", 0.6, 0.19], ["--se-diagram-lavender", 0.66, 0.35], ["--se-diagram-cyan", 0.7, 0.44], ["--se-diagram-cyan", 0.75, 0.55], ["--se-diagram-cyan", 0.72, 0.65], ["--se-diagram-cyan", 0.6, 0.75]],
  ],
  ember: [[["--se-diagram-coral", 0.7, 0.07], ["--se-diagram-coral", 0.78, 0.17], ["--se-diagram-coral", 0.85, 0.34], ["--se-diagram-coral", 0.9, 0.5], ["--se-diagram-amber", 0.9, 0.55], ["--se-diagram-amber", 0.95, 0.65], ["--se-diagram-amber", 0.95, 0.76]]],
  tide: [[["--se-diagram-cyan", 0.75, 0.06], ["--se-diagram-cyan", 0.78, 0.15], ["--se-diagram-cyan", 0.8, 0.29], ["--se-diagram-cyan", 0.82, 0.44], ["--se-diagram-lavender", 0.75, 0.6], ["--se-diagram-coral", 0.88, 0.62], ["--se-diagram-amber", 0.92, 0.7]]],
  bloom: [[["--se-diagram-lavender", 0.55, 0.08], ["--se-diagram-lavender", 0.6, 0.2], ["--se-diagram-lavender", 0.68, 0.38], ["--se-diagram-coral", 0.85, 0.54], ["--se-diagram-coral", 0.9, 0.64], ["--se-diagram-cyan", 0.8, 0.62], ["--se-diagram-amber", 0.92, 0.74]]],
  aurora: [[["--color-accent", 0.6, 0.06], ["--color-accent", 0.62, 0.15], ["--se-diagram-cyan", 0.72, 0.29], ["--color-accent", 0.68, 0.44], ["--se-diagram-cyan", 0.78, 0.57], ["--se-diagram-amber", 0.88, 0.65], ["--se-diagram-amber", 0.92, 0.75]]],
  dusk: [[["--se-diagram-lavender", 0.62, 0.07], ["--se-diagram-lavender", 0.6, 0.17], ["--se-diagram-coral", 0.72, 0.3], ["--se-diagram-coral", 0.88, 0.46], ["--se-diagram-amber", 0.9, 0.56], ["--se-diagram-amber", 0.95, 0.66], ["--se-diagram-cyan", 0.85, 0.72]]],
};
// Preview another palette in development with ?bonus=ember (or dusk, tide, bloom, aurora).
const PALETTE = (typeof location !== "undefined" && new URLSearchParams(location.search).get("bonus")) || "prism";

// One knob for how loud the whole field is; the per-stop values keep their proportions.
const SATURATION = 0.85;

/** A token's hue, re-voiced at the given saturation and lightness, as linear 0..1 RGB. */
function voiced([r, g, b]: [number, number, number], sat: number, light: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const hue = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = light - c / 2;
  const h = ((hue % 6) + 6) % 6;
  const [rr, gg, bb] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return [rr + m, gg + m, bb + m];
}

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float scale;
uniform float dissolve;  // 0 = the full field; 1 = every tile gone (used to hand over to the next slide)
uniform vec3 c0, c1, c2, c3, c4, c5, c6;
uniform vec3 d0, d1, d2, d3, d4, d5, d6;  // a second ramp; a slow noise picks which one each region uses

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), u.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

// A slow, warped field with one hot spot that keeps to the lower-right corner, clear of the word.
float field(vec2 uv) {
  vec2 p = uv * vec2(1.78, 1.0) * 1.15;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.035)), fbm(p + vec2(5.2, 1.3) - t * 0.03));
  vec2 w = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.02), fbm(p + 3.2 * q + vec2(8.3, 2.8)));
  float v = fbm(p + 2.6 * w);
  vec2 core = vec2(0.86 + 0.04 * sin(t * 0.11), 0.82 + 0.04 * cos(t * 0.09));
  vec2 d = (uv - core) * vec2(1.78, 1.0);
  v += 0.6 * exp(-dot(d, d) / 0.025);
  return v;
}

vec3 ramp(float v) {
  v = clamp(v, 0.0, 1.0) * 6.0;
  vec3 c = mix(c0, c1, clamp(v, 0.0, 1.0));
  c = mix(c, c2, clamp(v - 1.0, 0.0, 1.0));
  c = mix(c, c3, clamp(v - 2.0, 0.0, 1.0));
  c = mix(c, c4, clamp(v - 3.0, 0.0, 1.0));
  c = mix(c, c5, clamp(v - 4.0, 0.0, 1.0));
  c = mix(c, c6, clamp(v - 5.0, 0.0, 1.0));
  return c;
}
vec3 ramp2(float v) {
  v = clamp(v, 0.0, 1.0) * 6.0;
  vec3 c = mix(d0, d1, clamp(v, 0.0, 1.0));
  c = mix(c, d2, clamp(v - 1.0, 0.0, 1.0));
  c = mix(c, d3, clamp(v - 2.0, 0.0, 1.0));
  c = mix(c, d4, clamp(v - 3.0, 0.0, 1.0));
  c = mix(c, d5, clamp(v - 4.0, 0.0, 1.0));
  c = mix(c, d6, clamp(v - 5.0, 0.0, 1.0));
  return c;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
  float cell = 22.0 * scale;
  vec2 b = floor(px / cell);
  vec2 local = fract(px / cell) - 0.5;

  // Now and then a column of tiles slips up or down, like a sheet dragged through the scanner.
  float slip = step(0.955, h(vec2(b.x, floor(t * 0.8)))) * (h(vec2(b.x, floor(t * 0.8) + 3.0)) - 0.5) * 10.0;

  // Each tile is a lens: it shows a mirrored, magnified bit of the field around its centre.
  vec2 s = (b + vec2(0.0, slip) + 0.5) * cell - local * cell * 0.85;

  // Vertical threads: every 3 px a thread with its own tint, sampled a little to the side.
  float thread = floor(px.x / (3.0 * scale));
  float tw = h(vec2(thread, b.y));
  s.x += (tw - 0.5) * cell * 0.35;

  float v = field(s / res);
  // The whole sheet is colour: the lowest tiles land on deep cyan, never on the slide background.
  v = mix(0.04, 1.0, pow(smoothstep(0.3, 1.1, v), 1.45));
  v += (tw - 0.5) * 0.07;

  // Ordered dither on a 2 px checker, then a few steps, for the printed mesh.
  float dither = mod(floor(px.x / (2.0 * scale)) + floor(px.y / (2.0 * scale)), 2.0);
  v = floor(v * 11.0 + dither * 0.5) / 11.0;

  // Warm and cool regions drift slowly; both ramps share their dark stops, so borders pass through
  // the deep ground instead of mixing two bright hues into grey.
  float region = smoothstep(0.44, 0.56, fbm((s / res) * vec2(1.78, 1.0) * 0.8 + vec2(7.3, 2.1 + t * 0.012)));
  vec3 col = mix(ramp(v), ramp2(v), region);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lum), col, 1.0), 0.0, 1.0);

  // Seams between threads, the lit edge of each rib, and a hairline round each tile.
  float rib = fract(px.x / (3.0 * scale));
  col *= 1.0 - 0.42 * step(rib, 0.34);
  col += 0.06 * step(0.66, rib) * lum;
  vec2 e = abs(local);
  col *= 1.0 - 0.22 * step(0.47, max(e.x, e.y));

  // Dissolve tile by tile, roughly top to bottom with randomness, like the field draining away;
  // a tile flares a little just before it goes.
  float order = mix(h(b * 0.731 + vec2(4.1, 7.7)), b.y / (res.y / cell), 0.45);
  float alive = step(dissolve, order);
  col += 0.35 * alive * (1.0 - smoothstep(0.0, 0.08, order - dissolve)) * step(0.001, dissolve);
  gl_FragColor = vec4(col * alive, alive);
}`;

function rgb(c: string): [number, number, number] {
  const h = c.trim().replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * The field. With `dissolve`, it starts whole when the slide opens and falls away tile by tile
 * after `delay` seconds over `duration`, revealing whatever sits underneath; then it stops drawing.
 */
const FIELD_EPOCH = typeof performance !== "undefined" ? performance.now() : 0;

export function Field({ dissolve }: { dissolve?: { delay: number; duration: number } } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = useSlideIsActive();

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
    if (!canvas || !gl) return;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const style = getComputedStyle(canvas);
    const token = (v: string) => rgb(style.getPropertyValue(v) || "#000");
    const [warm, cool = warm] = PALETTES[PALETTE] ?? PALETTES.prism!;
    warm.forEach(([v, sat, light], i) => gl.uniform3fv(gl.getUniformLocation(prog, `c${i}`), voiced(token(v), sat * SATURATION, light)));
    cool.forEach(([v, sat, light], i) => gl.uniform3fv(gl.getUniformLocation(prog, `d${i}`), voiced(token(v), sat * SATURATION, light)));
    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");
    const uScale = gl.getUniformLocation(prog, "scale");

    // CSS resolution, not device pixels: the tiles are the texture, and it keeps the GPU cool.
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uScale, w / 1280);
    };
    const uDissolve = gl.getUniformLocation(prog, "dissolve");
    const draw = (time: number, gone = 0) => {
      size();
      gl.uniform1f(uT, time);
      gl.uniform1f(uDissolve, gone);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (gone < 1) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A dissolving field that isn't on screen shows whole, ready for its entrance; reduced motion skips it.
    // One shared clock for every field in the deck, so the next slide picks up the exact frame this one left.
    const fieldTime = () => 12 + (performance.now() - FIELD_EPOCH) / 1000;
    draw(fieldTime(), dissolve && reduced ? 1 : 0);
    if (!active || reduced) return;
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const gone = dissolve ? Math.min(1, Math.max(0, (elapsed - dissolve.delay) / dissolve.duration)) : 0;
      if (now - last > 33 || gone >= 1) { draw(fieldTime(), gone); last = now; }
      if (gone < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, dissolve?.delay, dissolve?.duration]);

  return <canvas ref={ref} className="ruby-bonus-field" aria-hidden="true" />;
}

/** `fullBleed` tells the deck not to slide this one in (see Deck). */
export function BonusSlide(_: { fullBleed?: boolean }) {
  return (
    <Slide title={"Bonus"} hideTitle layout="wide" className="ruby-slide ruby-bonus">
      <Field />
      <h2 className="ruby-bonus-word">bonus</h2>
      <SpeakerNote>
        <p>{"That's the talk. If we have a few minutes, here's a bonus."}</p>
      </SpeakerNote>
    </Slide>
  );
}
