import type { CSSProperties, ReactNode } from "react";
import { Slide } from "@talks/slide-engine";
import { SCENES } from "./scenes";
import { inOutCubic, lerp, prog } from "./ease";

export const W = 1920;
export const H = 1080;
export const FPS = 30;
const TR = 0.5; // one transition, one beat at 120 bpm
const BG = "#080a0b";
const ACCENT = "#b5e3bc";
const fill: CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H };

type Args = { t: number; step: number; since: number };
type SlideDef = {
  cls: string; label: string; title: string; sub: string; cues: string[]; scene: string; hold: number;
  /** Local seconds at which each step begins; `rate` speeds a step's entrance, `tr` the scene clock. */
  at: number[]; rate?: number; t0?: number; tr?: number;
};

// The slides, in the deck's own words. Each one is drawn with the deck's markup and CSS, and its
// illustration is the real scene, driven by the frame number instead of a wall clock.
const SLIDES: SlideDef[] = [
  { cls: "ruby-slide ruby-slide-need", label: "03 / The problem", title: "Every app needs a computer", sub: "And nobody gives you one for free.*", cues: ["The internet connects computers", "Your app needs one of its own"], scene: "Network", hold: 2.8, at: [0], t0: 3, tr: 1.4 },
  { cls: "ruby-slide ruby-slide-offer", label: "04 / The twist", title: "Amazon gives you computers for free*", sub: "Tiny ones. They start when someone calls and vanish when the work is done.", cues: ["Computers on demand, nothing to pay when idle", "Fifteen minutes, small or large"], scene: "Offer", hold: 4.2, at: [0, 2.3], t0: 9.4 },
  { cls: "ruby-slide ruby-slide-coldstart", label: "07 / The catch", title: "The first request boots all of Rails", sub: "Your code is the last thirty milliseconds.", cues: ["The platform starts a VM and Ruby", "Bundler resolves, Ruby requires every gem", "Rails runs initializers and eager-loads the app", "First request: Rack env, DB, templates, then your code"], scene: "ColdStart", hold: 3.4, at: [0, 0.7, 1.4, 2.1], rate: 3.2 },
  { cls: "ruby-slide ruby-stage ruby-slide-everycopy", label: "08 / The catch, again", title: "Every new copy boots Rails again", sub: "A server boots once and keeps going. On Lambda, every copy pays for the boot, and a burst starts several at once.", cues: ["Same traffic: one server, a fleet of copies", "Why the server tricks don't follow you to Lambda"], scene: "Concurrency", hold: 3.0, at: [0], t0: 2 },
  { cls: "ruby-slide ruby-caption ruby-slide-event-env", label: "11 / The mapper", title: "Every Rack key is already in the event", sub: "So we don't need Puma. We need a mapper: a field-by-field copy from Lambda's JSON to Rack's hash.", cues: [], scene: "EventToEnv", hold: 3.0, at: [0], t0: 0.5, tr: 1.8 },
  { cls: "ruby-slide ruby-band ruby-slide-ecosystem", label: "15 / The ecosystem", title: "Borrow the boring parts", sub: "Five layers sit between an event and a working app. Each already has a Ruby answer that knows the edge cases.", cues: ["The adapter: Lamby", "The framework: small, Rack, no magic", "Persistence: DynamoDB or SQL behind a proxy", "Jobs: SQS and a worker function", "The edge: CloudFront in front"], scene: "Ecosystem", hold: 3.4, at: [0, 0.6, 1.2, 1.8, 2.4], rate: 2.2 },
  { cls: "ruby-slide ruby-band ruby-slide-when", label: "18 / Know when to use it", title: "Serverless is a tool for bursts", sub: "Spiky, unpredictable traffic: Lambda. A steady hum: a server is cheaper and simpler. Either way, know the terrain before you walk it.", cues: ["Bursty traffic: Lambda wins", "Steady traffic: a server wins"], scene: "WhenToUse", hold: 3.4, at: [0, 1.8], rate: 1.5, t0: 3, tr: 1.2 },
  { cls: "ruby-slide ruby-stage ruby-slide-tailnet", label: "20 / Bonus: your own internet", title: "A Lambda can join your home network", sub: "With Tailscale inside the function, a public URL can reach the Pi, the NAS and Home Assistant at home. You rent no server and open no port on the router.", cues: ["A phone reaches Home Assistant through a Lambda", "Inside one copy: Tailscale in userspace", "The catches"], scene: "Tailnet", hold: 3.2, at: [0], rate: 1.3, t0: 0.5, tr: 1.3 },
  { cls: "ruby-slide ruby-band ruby-slide-spinel", label: "21 / Bonus: Ruby, ahead of time", title: "Compiled Ruby starts in milliseconds", sub: "Spinel is Matz's ahead-of-time compiler. It turns a Ruby program into C, then into one native binary. The Lambda runtime below is all Ruby.", cues: ["Ruby in, one native binary out", "What you give up", "Live, from eu-central-1"], scene: "Spinel", hold: 2.8, at: [0], t0: 3 },
  { cls: "ruby-slide ruby-stage ruby-slide-brain", label: "22 / Bonus: the home brain", title: "An assistant can run your house through one Lambda", sub: "A Ruby MCP server runs on Lambda and sits on your tailnet. ChatGPT or Claude calls its tools, and the tools reach your home. You still approve anything that moves.", cues: ["Sensors, tools, decisions", "The server: the mcp gem on Rack", "Before you connect it"], scene: "HomeBrain", hold: 3.6, at: [0], t0: 4, tr: 1.6 },
];

const STARTS = SLIDES.reduce<number[]>((a, s, i) => (a.push(i ? a[i - 1]! + SLIDES[i - 1]!.hold : 0), a), []);
export const DURATION = STARTS[STARTS.length - 1]! + SLIDES[SLIDES.length - 1]!.hold;
export const META = { frames: Math.round(DURATION * FPS), starts: STARTS.map((s) => Math.round(s * FPS)) };

function argsAt(s: SlideDef, u: number): Args {
  let step = 0;
  s.at.forEach((a, i) => { if (u >= a) step = i; });
  return { t: (s.t0 ?? 0) + u * (s.tr ?? 1), step, since: Math.max(0, u - s.at[step]!) * (s.rate ?? 1) + (s.at.length === 1 && !s.rate ? 3 : 0) };
}

function SlideFrame({ i, u }: { i: number; u: number }) {
  const s = SLIDES[i]!;
  const a = argsAt(s, u);
  return (
    <div style={{ ...fill, display: "grid", placeItems: "center" }}>
      {/* The deck's 1280×720 stage, scaled to 1080p exactly as the projector would. */}
      <div style={{ width: 1280, height: 720, flex: "none", transform: "scale(1.5)", containerType: "size", background: BG, position: "relative" }}>
        <Slide title={s.title} hideTitle layout="wide" className={s.cls}>
          <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
          <div className="ruby-layout">
            <div className="ruby-words">
              <p className="ruby-label">{s.label}</p>
              <h2>{s.title}</h2>
              <p className="ruby-subtitle">{s.sub}</p>
            </div>
            <figure className="se-layered-diagram" data-step={a.step} data-active="true" data-wide="false">
              <div className="se-layered-diagram-art">{SCENES[s.scene]!(a)}</div>
              {s.cues.length > 0 && (
                <figcaption>
                  <span>{s.cues[Math.min(a.step, s.cues.length - 1)]}</span>
                  <div role="group">
                    {s.cues.map((_, k) => <button key={k} type="button" aria-pressed={k === a.step}>{String(k + 1).padStart(2, "0")}</button>)}
                  </div>
                </figcaption>
              )}
            </figure>
          </div>
        </Slide>
      </div>
    </div>
  );
}

export function Timeline({ frame }: { frame: number }) {
  const T = Math.min(frame / FPS, DURATION);
  let k = 0;
  STARTS.forEach((s, i) => { if (T >= s) k = i; });
  const into = k > 0 && T < STARTS[k]! + TR;
  const p = inOutCubic(prog(T, STARTS[k]!, STARTS[k]! + TR));
  const fade = Math.min(prog(T, 0, 0.5), 1 - prog(T, DURATION - 0.6, DURATION));
  let content: ReactNode;
  if (into) {
    // The one transition: the old slide slides out, the new one slides in, together.
    content = (
      <>
        <div style={{ ...fill, transform: `translateX(${lerp(0, -W, p)}px)`, opacity: 1 - 0.6 * p }}><SlideFrame i={k - 1} u={T - STARTS[k - 1]!} /></div>
        <div style={{ ...fill, transform: `translateX(${lerp(W, 0, p)}px)` }}><SlideFrame i={k} u={T - STARTS[k]!} /></div>
      </>
    );
  } else content = <SlideFrame i={k} u={T - STARTS[k]!} />;
  return (
    <div style={{ ...fill, overflow: "hidden", background: BG }}>
      <div style={{ ...fill, opacity: fade }}>{content}</div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: (T / DURATION) * W, background: ACCENT, opacity: 0.8 }} />
    </div>
  );
}
