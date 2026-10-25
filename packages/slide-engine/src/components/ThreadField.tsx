import { useEffect, useRef } from "react";
import { useSlideIsActive } from "../Deck";

export interface ThreadFieldProps {
  /** CSS colors or custom properties (e.g. "--color-accent"), one per source band. */
  colors?: string[];
  threads?: number;
  /** Pulses in flight at once; each is a request travelling a thread. */
  pulses?: number;
  seed?: number;
  label?: string;
  className?: string;
}

const DEFAULT_COLORS = ["--color-accent", "--se-diagram-lavender", "--se-diagram-coral", "--se-diagram-cyan", "--se-diagram-amber"];
const SAMPLES = 40;
const DRAW_MS = 2600;

interface Thread {
  pts: Float32Array;
  color: number;
  delay: number;
  alpha: number;
  target: number;
}

interface Pulse {
  thread: number;
  t: number;
  speed: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveColor(el: Element, color: string) {
  return color.startsWith("--") ? getComputedStyle(el).getPropertyValue(color).trim() || "#fff" : color;
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * String-art bow-tie: many sources on the left squeeze through one narrow
 * waist and fan out to many endpoints on the right. Threads trace in when
 * the slide becomes active, then pulses keep running through the waist.
 * Ambient — no deck steps.
 */
export function ThreadField({ colors = DEFAULT_COLORS, threads = 900, pulses = 70, seed = 7, label, className }: ThreadFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useSlideIsActive();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const palette = colors.map((c) => resolveColor(canvas, c));
    const fg = resolveColor(canvas, "--color-fg");

    let w = 0;
    let h = 0;
    let field: Thread[] = [];
    let targets: { x: number; y: number; heat: number }[] = [];
    let flying: Pulse[] = [];
    let raf = 0;
    const start = performance.now();
    const rand = rng(seed);

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const r = rng(seed);
      const waistX = w * 0.46;
      const waistY = h * 0.5;
      const bands = palette.length;
      targets = Array.from({ length: Math.round(threads / 6) }, () => ({
        x: w * (0.86 + r() * 0.12),
        y: h * (0.04 + r() * 0.92),
        heat: 0,
      }));
      field = Array.from({ length: threads }, () => {
        const color = Math.floor(r() * bands);
        const bandTop = (color / bands) * 0.9 + 0.05;
        const sx = w * (0.01 + r() * 0.04);
        const sy = h * (bandTop + r() * (0.9 / bands));
        const target = Math.floor(r() * targets.length);
        const { x: tx, y: ty } = targets[target]!;
        const spread = h * 0.035;
        const c1y = waistY + (r() - 0.5) * spread;
        const c2y = waistY + (r() - 0.5) * spread;
        const pts = new Float32Array((SAMPLES + 1) * 2);
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          pts[i * 2] = bezier(sx, waistX, waistX, tx, t);
          pts[i * 2 + 1] = bezier(sy, c1y, c2y, ty, t);
        }
        return { pts, color, target, delay: r() * 0.55, alpha: 0.1 + r() * 0.25 };
      });
      flying = [];
    };

    const trace = (th: Thread, from: number, to: number) => {
      const a = Math.max(0, Math.floor(from * SAMPLES));
      const b = Math.min(SAMPLES, Math.ceil(to * SAMPLES));
      if (b <= a) return;
      ctx.moveTo(th.pts[a * 2]!, th.pts[a * 2 + 1]!);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(th.pts[i * 2]!, th.pts[i * 2 + 1]!);
    };

    const spawn = (): Pulse => ({ thread: Math.floor(rand() * field.length), t: 0, speed: 0.0035 + rand() * 0.006 });

    const frame = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / DRAW_MS);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 0.7;

      for (const th of field) {
        const local = Math.min(1, Math.max(0, (progress - th.delay) / (1 - th.delay)));
        if (local <= 0) continue;
        const eased = 1 - Math.pow(1 - local, 3);
        ctx.globalAlpha = th.alpha;
        ctx.strokeStyle = palette[th.color]!;
        ctx.beginPath();
        trace(th, 0, eased);
        ctx.stroke();
      }

      if (progress >= 1 && !reduced) {
        while (flying.length < pulses) flying.push(spawn());
        ctx.lineWidth = 1.4;
        for (let i = 0; i < flying.length; i++) {
          const p = flying[i]!;
          const th = field[p.thread]!;
          p.t += p.speed;
          if (p.t >= 1) {
            targets[th.target]!.heat = 1;
            flying[i] = spawn();
            continue;
          }
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = palette[th.color]!;
          ctx.beginPath();
          trace(th, Math.max(0, p.t - 0.12), p.t);
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      for (const tg of targets) {
        ctx.globalAlpha = (0.35 + tg.heat * 0.65) * progress;
        ctx.fillStyle = fg;
        const size = 2.2 + tg.heat * 3.6;
        ctx.fillRect(tg.x - size / 2, tg.y - size / 2, size, size);
        tg.heat *= 0.94;
      }
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    build();
    const ro = new ResizeObserver(() => {
      build();
      if (reduced) frame(performance.now());
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, colors, threads, pulses, seed]);

  return (
    <canvas
      ref={canvasRef}
      className={["se-thread-field", className].filter(Boolean).join(" ")}
      style={{ display: "block", width: "100%", height: "100%" }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
