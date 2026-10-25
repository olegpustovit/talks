import { createContext, memo, useContext, useRef, type ReactNode } from "react";

export const C = {
  fg: "var(--color-fg)",
  muted: "var(--color-muted)",
  border: "var(--color-border)",
  surface: "var(--color-surface)",
  bg: "var(--color-bg)",
  accent: "var(--color-accent)",
  coral: "var(--se-diagram-coral)",
  lavender: "var(--se-diagram-lavender)",
  cyan: "var(--se-diagram-cyan)",
  amber: "var(--se-diagram-amber)",
};
export const PALETTE = [C.accent, C.lavender, C.coral, C.cyan, C.amber];

export type Pt = [number, number];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 as t moves from a to b, clamped. */
export const phase = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (p: number) => 1 - Math.pow(1 - p, 3);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** Stable pseudo-random in [0, 1) for an integer seed. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Fade in over [a, a+.4], hold, fade out over [b-.5, b]. */
export const life = (t: number, a: number, b: number) => Math.min(phase(t, a, a + 0.4), 1 - phase(t, b - 0.5, b));

function lengths(pts: Pt[]) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
  return { seg, total: seg.reduce((a, b) => a + b, 0) };
}

export function pointOn(pts: Pt[], p: number): Pt {
  const { seg, total } = lengths(pts);
  let d = clamp01(p) * total;
  for (let i = 0; i < seg.length; i++) {
    const len = seg[i]!;
    if (d <= len || i === seg.length - 1) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const k = len === 0 ? 0 : d / len;
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    }
    d -= len;
  }
  return pts[0]!;
}

export const poly = (pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");

/** Shared filter defs; scenes reference url(#ruby-glow). One scene renders at a time. */
export function Defs() {
  return (
    <defs>
      <filter id="ruby-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** How a scene sits in its grid cell: against the caption side, so its edge lands on a column line. */
export const SceneAlign = createContext("xMidYMid meet");

export function Scene({ label, children, viewBox = "0 0 1000 440" }: { label: string; children: ReactNode; viewBox?: string }) {
  const align = useContext(SceneAlign);
  return (
    <svg className="ruby-scene" viewBox={viewBox} preserveAspectRatio={align} role="img" aria-label={label}>
      <Defs />
      {children}
    </svg>
  );
}

/**
 * Stage scenes draw in stage pixels: 12 columns of 74 with 24 gutters, 1152 wide, as tall as the
 * scene cell. Text sizes here are the sizes the room sees, and `col(n)` is a column line.
 */
export const STAGE = { w: 1152, h: 476 };
export const col = (n: number) => n * 98;
export const colSpan = (n: number) => n * 98 - 24;

export function StageScene({ label, children, h = STAGE.h }: { label: string; children: ReactNode; h?: number }) {
  return (
    <svg className="ruby-scene" viewBox={`0 0 ${STAGE.w} ${h}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label={label}>
      <Defs />
      {children}
    </svg>
  );
}

/** In-out cubic, the same curve as the CSS fold (--ruby-fold), so SVG and HTML move together. */
export const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * 0 → 1 as a stage scene folds the words away (`wide`), 1 → 0 on the way back, over 0.9 s
 * from the step change. Starts from wherever it was, so quick key presses never jump.
 */
export function useFold(wide: boolean, step: number, since: number) {
  const r = useRef({ step, from: wide ? 1 : 0, to: wide ? 1 : 0, last: wide ? 1 : 0 });
  if (r.current.step !== step) r.current = { step, from: r.current.last, to: wide ? 1 : 0, last: r.current.last };
  const v = lerp(r.current.from, r.current.to, inOut(phase(since, 0, 0.9)));
  r.current.last = v;
  return v;
}

/**
 * useFold for several values at once: each step names its targets, and the scene glides
 * from wherever it is to the new ones over 0.9 s. Geometry and per-step presences both use it.
 */
export function useStepTween(targets: number[], step: number, since: number) {
  const r = useRef({ step, from: targets, to: targets, last: targets });
  if (r.current.step !== step) r.current = { step, from: r.current.last, to: targets, last: r.current.last };
  const k = inOut(phase(since, 0, 0.9));
  const v = r.current.to.map((to, i) => lerp(r.current.from[i] ?? to, to, k));
  r.current.last = v;
  return v;
}

export function Wire({ pts, color = C.border, dashed, opacity = 1, width = 1 }: { pts: Pt[]; color?: string; dashed?: boolean; opacity?: number; width?: number }) {
  return <polyline points={poly(pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? "3 5" : undefined} opacity={opacity} />;
}

/** A request travelling a wire, drawn as a square pixel; visible only while 0 < p < 1. */
export function Packet({ pts, p, color = C.accent, r = 4 }: { pts: Pt[]; p: number; color?: string; r?: number }) {
  if (p <= 0 || p >= 1) return null;
  const head = pointOn(pts, p);
  const tail = pointOn(pts, Math.max(0, p - 0.18));
  return (
    <g filter="url(#ruby-glow)">
      <line x1={tail[0]} y1={tail[1]} x2={head[0]} y2={head[1]} stroke={color} strokeWidth={1.6} opacity={0.6} />
      <rect x={head[0] - r} y={head[1] - r} width={r * 2} height={r * 2} fill={color} />
    </g>
  );
}

export function Text({ x, y, children, size = 13, color = C.muted, anchor = "start", mono, weight, opacity }: { x: number; y: number; children: ReactNode; size?: number; color?: string; anchor?: "start" | "middle" | "end"; mono?: boolean; weight?: number; opacity?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontWeight={weight} opacity={opacity} className={mono ? "ruby-mono" : undefined}>
      {children}
    </text>
  );
}

/** The product that is already running: a flickering dot matrix of live traffic. */
export function CoreGrid({ x, y, cols, rows, t, cell = 10, gap = 3, label = "core app", sub }: { x: number; y: number; cols: number; rows: number; t: number; cell?: number; gap?: number; label?: string; sub?: string }) {
  const step = cell + gap;
  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const v = hash(i * 7 + Math.floor(t * 4 + hash(i) * 9));
    const busy = Math.sin(col / cols * Math.PI) * 0.5 + 0.5;
    cells.push(
      <rect key={i} x={x + col * step} y={y + row * step} width={cell} height={cell}
        fill={i % 11 === 3 ? C.amber : C.accent} opacity={0.08 + v * busy * 0.75} />,
    );
  }
  const h = rows * step - gap;
  return (
    <g>
      {cells}
      <Text x={x} y={y + h + 22} color={C.fg} size={15}>{label}</Text>
      {sub && <Text x={x} y={y + h + 40} size={12}>{sub}</Text>}
    </g>
  );
}

/** A Lambda execution environment; `draw` traces its border in (cold start). */
export function LambdaBox({ x, y, w, h, title, draw = 1, color = C.accent, children }: { x: number; y: number; w: number; h: number; title: string; draw?: number; color?: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.surface} fillOpacity={0.55 * draw} stroke={color} strokeWidth={1.2}
        pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      <g opacity={draw}>
        <Text x={x + 14} y={y + 24} color={color} size={15} weight={400}>λ</Text>
        <Text x={x + 32} y={y + 24} color={C.fg} size={14.5} mono>{title}</Text>
        {children}
      </g>
    </g>
  );
}

/** `mono` only when the label is code: an endpoint, a command. */
export function Chip({ x, y, w, label, color = C.fg, active = 1, mono }: { x: number; y: number; w: number; label: string; color?: string; active?: number; mono?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} fill={C.bg} stroke={color} strokeOpacity={0.3 + active * 0.7} />
      <Text x={x + w / 2} y={y + 22} anchor="middle" color={color} size={13} mono={mono} opacity={0.5 + active * 0.5}>{label}</Text>
    </g>
  );
}

/** Object storage as a barcode: one stripe per stored result. */
export function Bucket({ x, y, w, h, count, flash = 0, label }: { x: number; y: number; w: number; h: number; count: number; flash?: number; label: string }) {
  const stripes = [];
  const pitch = 9;
  const max = Math.floor(h / pitch);
  const shown = Math.min(count, max);
  for (let i = 0; i < shown; i++) {
    const newest = i === shown - 1;
    const width = w * (0.35 + hash(i + 40) * 0.65);
    stripes.push(
      <rect key={i} x={x} y={y + h - (i + 1) * pitch} width={width} height={5}
        fill={newest && flash > 0 ? C.fg : PALETTE[Math.floor(hash(i + 3) * PALETTE.length)]}
        opacity={newest ? 0.5 + flash * 0.5 : 0.75} filter={newest && flash > 0 ? "url(#ruby-glow)" : undefined} />,
    );
  }
  return (
    <g>
      <line x1={x - 6} y1={y} x2={x - 6} y2={y + h} stroke={C.border} />
      {stripes}
      <Text x={x - 6} y={y + h + 22} color={C.fg} size={12} mono>{label}</Text>
    </g>
  );
}

/** A SQL database as a table: header bar plus rows. Square, like everything else. */
export function Database({ x, y, w, h, label, color = C.fg, glow = 0 }: { x: number; y: number; w: number; h: number; label: string; color?: string; glow?: number }) {
  const rows = Math.max(2, Math.floor((h - 26) / 12));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.surface} stroke={color} strokeOpacity={0.5 + glow * 0.5} />
      <rect x={x} y={y} width={w} height={22} fill={color} opacity={0.14 + glow * 0.2} />
      <Text x={x + 10} y={y + 15} color={color} size={13}>{label}</Text>
      {Array.from({ length: rows }, (_, i) => (
        <line key={i} x1={x + 10} x2={x + w - 10} y1={y + 34 + i * 12} y2={y + 34 + i * 12} stroke={color} strokeOpacity={0.18} />
      ))}
      <line x1={x + w * 0.38} x2={x + w * 0.38} y1={y + 22} y2={y + h} stroke={color} strokeOpacity={0.18} />
    </g>
  );
}

/** Dashed boundary for "this lives in its own repo" or "this is the VPC". */
export function Boundary({ x, y, w, h, label, color = C.muted }: { x: number; y: number; w: number; h: number; label: string; color?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeOpacity={0.45} strokeDasharray="2 6" />
      <Text x={x + 12} y={y - 9} size={13} color={color}>{label}</Text>
    </g>
  );
}

/* ---------- Code, drawn in SVG so lines and connectors align exactly. ---------- */

export type Lang = "ruby" | "json" | "ts" | "hcl" | "text";
const TS_KEYWORDS = /^(const|let|new|import|from|export|default|return|async|await|function|true|false)$/;
const HCL_KEYWORDS = /^(resource|data|variable|output|module|provider|terraform|locals|will|be|true|false)$/;
// Ruby's pattern with the comment marker swapped: # for Ruby and HCL, // for TypeScript.
const CODE_RE = (comment: string) => new RegExp(`(${comment}.*$)|("(?:[^"\\\\]|\\\\.)*")|(:[a-z_]\\w*|\\b[a-z_]\\w*:(?!:))|(\\b\\d[\\d_]*\\b)|(\\b[A-Z][A-Za-z0-9_]*\\b)|(\\b[a-z_]\\w*\\b)|([^#"\\w:/]+|[:/]|\\w)`, "g");
const RE = { ruby: CODE_RE("#"), hcl: CODE_RE("#"), ts: CODE_RE("//") };
const RUBY_KEYWORDS = /^(def|end|do|class|module|if|unless|else|return|self|nil|true|false|require|require_relative|run|each)$/;
type Tok = { text: string; color: string };

/** A tiny highlighter: comments, strings, symbols, numbers, constants, keywords. Enough for slides. */
const tokenCache = new Map<string, Tok[]>();
export function tokenize(line: string, lang: Lang): Tok[] {
  const key = lang + line;
  const hit = tokenCache.get(key);
  if (hit) return hit;
  const out = tokenizeLine(line, lang);
  tokenCache.set(key, out);
  return out;
}

function tokenizeLine(line: string, lang: Lang): Tok[] {
  const out: Tok[] = [];
  if (lang === "text") return [{ text: line, color: C.fg }];
  const re = lang === "json"
    ? /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([^"\d]+?)(?=["\d]|\btrue\b|\bfalse\b|\bnull\b|$)/g
    : RE[lang];
  re.lastIndex = 0;
  const keywords = lang === "ts" ? TS_KEYWORDS : lang === "hcl" ? HCL_KEYWORDS : RUBY_KEYWORDS;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[0] === "") { re.lastIndex++; continue; }
    if (lang === "json") {
      if (m[1]) { out.push({ text: m[1], color: m[2] ? C.cyan : C.amber }); if (m[2]) out.push({ text: m[2], color: C.muted }); }
      else if (m[3]) out.push({ text: m[3], color: C.coral });
      else if (m[4]) out.push({ text: m[4], color: C.lavender });
      else out.push({ text: m[0], color: C.muted });
    } else {
      if (m[1]) out.push({ text: m[1], color: C.muted });
      else if (m[2]) out.push({ text: m[2], color: C.amber });
      else if (m[3]) out.push({ text: m[3], color: C.lavender });
      else if (m[4]) out.push({ text: m[4], color: C.coral });
      else if (m[5]) out.push({ text: m[5], color: C.cyan });
      else if (m[6]) out.push({ text: m[6], color: keywords.test(m[6]) ? C.accent : C.fg });
      else out.push({ text: m[0], color: C.muted });
    }
  }
  return out;
}

/** Pragmasevka is half an em wide, so columns are exact. */
export const charW = (size: number) => size * 0.5;

/**
 * A code card: filename bar, highlighted lines, and a per-line `focus` (0..1).
 * When any line has focus, the others dim, so the eye goes where the speaker is.
 */
export function Code({ x, y, w, title, lines, lang = "ruby", size = 12.5, lineH = 19, focus, shown = lines.length, accent = C.accent }: {
  x: number; y: number; w: number; title?: string; lines: string[]; lang?: Lang; size?: number; lineH?: number;
  focus?: (i: number) => number; shown?: number; accent?: string;
}) {
  const top = title ? 30 : 12;
  const h = top + lines.length * lineH + 10;
  const anyFocus = focus ? lines.some((_, i) => focus(i) > 0.01) : false;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.surface} stroke={C.border} />
      {title && (
        <g>
          <line x1={x} x2={x + w} y1={y + 22} y2={y + 22} stroke={C.border} />
          <Text x={x + 12} y={y + 15} size={12} color={C.muted} mono>{title}</Text>
        </g>
      )}
      {lines.map((line, i) => {
        if (i >= shown) return null;
        const f = focus ? focus(i) : 0;
        return <CodeLine key={i} line={line} lang={lang} x={x} y={y + top + i * lineH} w={w} lineH={lineH} size={size} f={f} dim={anyFocus} accent={accent} />;
      })}
    </g>
  );
}
// Scenes re-render every frame; a line only re-renders when its own position, size or focus moves.
const CodeLine = memo(function CodeLine({ line, lang, x, y, w, lineH, size, f, dim, accent }: {
  line: string; lang: Lang; x: number; y: number; w: number; lineH: number; size: number; f: number; dim: boolean; accent: string;
}) {
  return (
    <g opacity={dim ? 0.38 + 0.62 * f : 1}>
      {f > 0.01 && <rect x={x + 1} y={y} width={w - 2} height={lineH} fill={accent} opacity={0.1 * f} />}
      {f > 0.01 && <rect x={x + 1} y={y} width={2} height={lineH} fill={accent} opacity={f} />}
      <text x={x + 14} y={y + lineH * 0.7} fontSize={size} className="ruby-mono" xmlSpace="preserve" style={{ whiteSpace: "pre" }}>
        {tokenize(line, lang).map((tk, k) => <tspan key={k} fill={tk.color}>{tk.text}</tspan>)}
      </text>
    </g>
  );
});

export const codeHeight = (n: number, lineH = 19, titled = true) => (titled ? 30 : 12) + n * lineH + 10;

/** A connector with marching dashes: motion that says "flows this way" without dots. */
export function Flow({ d, t, on = 1, color = C.accent }: { d: string; t: number; on?: number; color?: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.18} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeDasharray="5 7" strokeDashoffset={-t * 26} opacity={on} />
    </g>
  );
}
/** Vertical centre of line `i` in a Code card placed at `y`. */
export const lineY = (y: number, i: number, lineH = 19, titled = true) => y + (titled ? 30 : 12) + i * lineH + lineH / 2;
