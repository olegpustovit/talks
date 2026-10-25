import { useEffect, useRef } from "react";
import { useSlideIsActive } from "../Deck";

export interface SilkFieldProps {
  /** CSS colors or custom properties (e.g. "--color-accent"); strands cycle through them in bands. */
  colors?: string[];
  /** Number of strands. */
  strands?: number;
  /** 0..1, how far the flow pulls strands out of line. */
  turbulence?: number;
  /** Overall opacity, 0..1. */
  intensity?: number;
  /** Where the flow takes hold: "right" (combed at the left, wild at the right) or "middle" (combed at both ends). */
  shape?: "right" | "middle";
  label?: string;
  className?: string;
}

const DEFAULT_COLORS = ["--se-diagram-coral", "--se-diagram-amber", "--color-accent", "--se-diagram-cyan", "--se-diagram-lavender"];
const SAMPLES = 140;

// Simplex noise (Ashima / Stefan Gustavson, MIT) and its curl, evaluated per vertex.
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
// Curl of a scalar potential: a divergence-free flow, so neighbouring strands fold together
// instead of crossing at random.
vec2 curl(vec3 p){
  float e=0.02;
  float dy=snoise(p+vec3(0.0,e,0.0))-snoise(p-vec3(0.0,e,0.0));
  float dx=snoise(p+vec3(e,0.0,0.0))-snoise(p-vec3(e,0.0,0.0));
  return vec2(dy,-dx)/(2.0*e);
}`;

const VERT = `
precision highp float;
attribute vec2 a_uv;     // u: along the strand 0..1, v: which strand 0..1
attribute float a_side;  // -1 / +1: the two edges of the ribbon
attribute vec3 a_color;
uniform float u_time;
uniform float u_aspect;
uniform float u_turb;
uniform vec2 u_px;       // canvas size in device pixels
uniform float u_width;   // strand width in device pixels
uniform float u_middle;  // 1: straight at both ends, moving in the middle
varying vec3 v_color;
varying float v_shade;
varying float v_u;
varying float v_side;
${NOISE}
// Where a strand point sits after the flow has carried it, in 0..aspect x 0..1 units.
vec2 carried(float u, float v){
  float pull=mix(pow(smoothstep(0.08,1.0,u),1.35), pow(sin(3.14159265*u),1.6), u_middle)*u_turb;
  vec2 base=vec2(u*u_aspect, v);
  vec3 q=vec3(base*1.15, u_time*0.045);
  vec2 f=curl(q)*0.13+curl(q*2.3+vec3(3.1,1.7,0.0))*0.035;
  // A slower swell lifts whole sheets of strands, like fabric in wind.
  float swell=snoise(vec3(u*1.1, v*0.7, u_time*0.03))*0.34;
  // Strands bunch into ribbons and fray apart the further they travel.
  float bunch=snoise(vec3(v*7.0, u*1.6, u_time*0.05))*0.07;
  float fray=(fract(sin(v*1271.3)*43758.5)-0.5)*0.05*u*u;
  return base+vec2(f.x*0.7, f.y+swell+bunch+fray)*pull;
}
vec2 toPx(vec2 p){ return vec2(p.x/u_aspect, p.y)*u_px; }
void main(){
  float u=a_uv.x, v=a_uv.y;
  float du=1.0/${SAMPLES}.0;
  // Each point is extruded sideways, perpendicular to the strand on screen, so lines get a real width.
  vec2 a=toPx(carried(u,v));
  vec2 b=toPx(carried(min(u+du,1.0),v));
  vec2 c=toPx(carried(max(u-du,0.0),v));
  vec2 t=normalize(b-c+vec2(1e-5,0.0));
  vec2 n=vec2(-t.y,t.x);
  vec2 px=a+n*a_side*(u_width*0.5+1.0);
  v_shade=0.62+0.38*sin(snoise(vec3(vec2(u*u_aspect,v)*0.9,u_time*0.04+7.0))*4.0+v*18.0);
  v_color=a_color;
  v_u=u;
  v_side=a_side;
  gl_Position=vec4(px.x/u_px.x*2.0-1.0, 1.0-px.y/u_px.y*2.0, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform float u_intensity;
uniform float u_middle;
uniform float u_width;
varying vec3 v_color;
varying float v_shade;
varying float v_u;
varying float v_side;
void main(){
  // Antialiased edge: full inside the strand, a one-pixel falloff at each side.
  float hw=u_width*0.5+1.0;
  float d=abs(v_side)*hw;
  float aa=clamp(hw-d, 0.0, 1.0);
  // Theme colours are pastel; give them poster strength without changing the hue.
  float lum=dot(v_color,vec3(0.299,0.587,0.114));
  vec3 c=clamp(mix(vec3(lum),v_color,1.7),0.0,1.0)*v_shade;
  float edge=smoothstep(0.0,0.06,v_u)*mix(1.0, smoothstep(1.0,0.94,v_u), u_middle);
  gl_FragColor=vec4(c, 0.85*u_intensity*edge*aa);
}`;

function rgb(el: Element, color: string): [number, number, number] {
  const c = (color.startsWith("--") ? getComputedStyle(el).getPropertyValue(color) : color).trim().replace("#", "") || "ffffff";
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Silk: parallel strands, combed straight at the left edge, carried by an animated curl-noise flow
 * towards the right so they billow, fold and twist. Bands of the theme's colours run across the
 * strands. One draw call; the GPU does the motion and the CPU sets a few uniforms per frame.
 */
export function SilkField({ colors = DEFAULT_COLORS, strands = 300, turbulence = 1, intensity = 1, shape = "right", label, className }: SilkFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = useSlideIsActive();

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: true, premultipliedAlpha: false, alpha: true });
    if (!canvas || !gl) return;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn("SilkField:", gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("SilkField:", gl.getProgramInfoLog(prog)); return; }
    gl.useProgram(prog);

    // Colour bands: runs of strands share a colour, each run a few strands wide, with a soft blend
    // into the next, like the stacked bands in a woven ribbon.
    const palette = colors.map((c) => rgb(canvas, c));
    const STRIDE = 6; // u v side r g b
    const per = SAMPLES + 1;
    const data = new Float32Array(strands * per * 2 * STRIDE);
    const index = new Uint32Array(strands * SAMPLES * 6);
    let o = 0, ix = 0;
    for (let k = 0; k < strands; k++) {
      // Inset top and bottom so the flow has room to lift strands without clipping at the canvas edge.
      // A middle billow travels further than a right-hand one, so it gets a deeper inset.
      const inset = shape === "middle" ? 0.26 : 0.16;
      const v = inset + (k / (strands - 1)) * (1 - 2 * inset);
      const run = (k / 34) % palette.length;
      const i0 = Math.floor(run), f = run - i0;
      const a = palette[i0]!, b = palette[(i0 + 1) % palette.length]!;
      const mixF = f < 0.55 ? 0 : (f - 0.55) / 0.45;
      const col = [0, 1, 2].map((j) => a[j]! + (b[j]! - a[j]!) * mixF);
      const first = k * per * 2;
      for (let i = 0; i < per; i++) {
        for (const side of [-1, 1]) {
          data[o++] = i / SAMPLES; data[o++] = v; data[o++] = side; data[o++] = col[0]!; data[o++] = col[1]!; data[o++] = col[2]!;
        }
        if (i < SAMPLES) {
          const p = first + i * 2;
          index.set([p, p + 1, p + 2, p + 1, p + 3, p + 2], ix);
          ix += 6;
        }
      }
    }
    if (!gl.getExtension("OES_element_index_uint")) { console.warn("SilkField: no 32-bit indices"); return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    const attr = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
    };
    attr("a_uv", 2, 0); attr("a_side", 1, 2); attr("a_color", 3, 3);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uTime = u("u_time"), uAspect = u("u_aspect"), uPx = u("u_px"), uWidth = u("u_width"), uIntensity = u("u_intensity");
    gl.uniform1f(u("u_turb"), turbulence);
    gl.uniform1f(u("u_middle"), shape === "middle" ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const count = index.length;

    const draw = (time: number, fade: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(uAspect, w / h);
      gl.uniform2f(uPx, w, h);
      gl.uniform1f(uWidth, 1.15 * dpr);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uIntensity, intensity * fade);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reduced) { draw(20, 1); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const s = (now - start) / 1000;
      // Entry is a plain fade; the flow is already moving underneath.
      const fade = Math.min(1, s / 1.4);
      draw(20 + s, fade * fade * (3 - 2 * fade));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, colors, strands, turbulence, intensity, shape]);

  return (
    <canvas
      ref={ref}
      className={["se-silk-field", className].filter(Boolean).join(" ")}
      style={{ display: "block", width: "100%", height: "100%" }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
