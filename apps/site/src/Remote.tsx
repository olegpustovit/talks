import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { DeckPreviewProvider, useRemoteSender, type DeckState } from "@talks/slide-engine";
import { talks } from "./talks/registry";

const MODE_KEY = "slides.remote.mode";
const square = { borderRadius: 0 } as const;
// The remote is always dark, whatever talk it drives: it's held in a dim room next to a projector.
const REMOTE_THEME = {
  "--color-bg": "#080a0b", "--color-surface": "#111514", "--color-fg": "#eeefeb", "--color-muted": "#909795",
  "--color-accent": "#b5e3bc", "--color-accent-fg": "#080a0b", "--color-border": "#252b2a",
  colorScheme: "dark",
} as CSSProperties;

function load(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: it just won't be remembered.
  }
}

function clock(total: number): string {
  const abs = Math.max(0, Math.round(Math.abs(total)));
  return `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

type Mode = "buttons" | "trackpad";

export function Remote() {
  const { status, send, goTo, point, scroll, deck } = useRemoteSender();
  const [mode, setMode] = useState<Mode>(() => (load(MODE_KEY) === "trackpad" ? "trackpad" : "buttons"));
  const [menu, setMenu] = useState(false);
  const live = status.connected && status.decks > 0;

  const pick = (m: Mode) => {
    setMode(m);
    store(MODE_KEY, m);
    if (m === "buttons") point({ x: 0.5, y: 0.5, hide: true });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-bg font-sans text-fg select-none" style={{ touchAction: "manipulation", ...REMOTE_THEME }}>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <Header deck={deck} live={live} connected={status.connected} onMenu={deck ? () => setMenu(true) : undefined} />
        <TalkClock />


        <div className="grid grid-cols-2 border border-border" role="tablist" aria-label="Remote mode">
          {(["buttons", "trackpad"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => pick(m)}
              className={["py-2.5 text-sm font-medium", mode === m ? "bg-fg text-bg" : "bg-transparent text-muted"].join(" ")}
              style={square}
            >
              {m === "buttons" ? "Buttons" : "Trackpad"}
            </button>
          ))}
        </div>

        {mode === "trackpad" ? (
          <Trackpad onPoint={point} onScroll={scroll} disabled={!live} />
        ) : (
          <button
            type="button"
            disabled={!live}
            onClick={() => send("next")}
            className="flex min-h-0 flex-1 flex-col justify-start gap-3 bg-accent p-3 text-left text-accent-fg disabled:opacity-35"
            style={square}
          >
            <span className="flex items-baseline justify-between gap-3 px-1">
              <UpNextLabel deck={deck} />
              <span className="shrink-0 text-2xl font-medium tracking-tight">Next →</span>
            </span>
            <NextPreview deck={deck} />
          </button>
        )}

        {mode === "trackpad" && upNext(deck) && (
          <p className="m-0 truncate text-sm text-muted">
            <span className="text-accent">{upNext(deck)!.kind}:</span> {upNext(deck)!.text}
          </p>
        )}
        <div className="grid grid-cols-2 gap-px bg-border">
          <NavButton label="Back" sub="previous step" disabled={!live} onClick={() => send("prev")} />
          {mode === "trackpad" ? (
            <NavButton label="Next" sub="next step" accent disabled={!live} onClick={() => send("next")} />
          ) : (
            <NavButton label="Next slide" sub="skip the steps" disabled={!live} onClick={() => send("nextSlide")} />
          )}
          <NavButton label="Prev slide" sub="jump back" disabled={!live} onClick={() => send("prevSlide")} />
          {mode === "trackpad" ? (
            <NavButton label="Next slide" sub="skip the steps" disabled={!live} onClick={() => send("nextSlide")} />
          ) : (
            <NavButton label="Slides" sub="jump to one" disabled={!deck} onClick={() => setMenu(true)} />
          )}
        </div>
      </div>

      {menu && deck && (
        <SlideMenu
          deck={deck}
          onPick={(i) => {
            goTo(i);
            setMenu(false);
          }}
          onClose={() => setMenu(false)}
        />
      )}
    </div>
  );
}

/** What the next press will show: the next step's caption, or the next slide's title. */
function upNext(deck: DeckState | null): { kind: string; text: string } | null {
  if (!deck) return null;
  if (deck.step < deck.steps) {
    const label = deck.stepLabels?.[deck.step + 1];
    return { kind: `next step · ${deck.step + 2} of ${deck.steps + 1}`, text: label || "the next reveal on this slide" };
  }
  return { kind: `next slide · ${deck.index + 2}`, text: deck.next || "end of the talk" };
}

function UpNextLabel({ deck }: { deck: DeckState | null }) {
  const n = upNext(deck);
  if (!n) return <span className="text-sm opacity-70">next</span>;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[11px] tracking-wide uppercase opacity-60">{n.kind}</span>
      <span className="truncate text-base leading-tight font-medium">{n.text}</span>
    </span>
  );
}

/**
 * The deck itself, rendered on the phone at the slide and step the next press will show.
 * It's the same talk component the projector runs, in preview mode: alive, but not in control.
 */
function NextPreview({ deck }: { deck: DeckState | null }) {
  const talk = deck ? talks.find((t) => t.title === deck.talk) : undefined;
  if (!deck || !talk) return <div className="aspect-video w-full bg-black/30" />;
  const last = deck.step >= deck.steps;
  const target = last ? { index: Math.min(deck.index + 1, deck.count - 1), step: 0 } : { index: deck.index, step: deck.step + 1 };
  const Talk = talk.component;
  return (
    // A fixed 16:9 frame: the deck scales itself to fit whatever box it's given, so it needs a real size.
    <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black" style={{ pointerEvents: "none" }} aria-hidden="true">
      {/* The deck's theme wrapper has no height of its own; give it the frame's. */}
      <div className="absolute inset-0 [&_.slide-engine-theme-root]:h-full">
        <DeckPreviewProvider value={target}>
          <Talk />
        </DeckPreviewProvider>
      </div>
    </div>
  );
}

const CLOCK_KEY = "slides.remote.talkClock";
type Clock = { elapsed: number; since: number | null };

/** The talk stopwatch: start, pause, continue, and a two-tap reset. Survives reloads. */
function TalkClock() {
  const now = useNow();
  const [c, setC] = useState<Clock>(() => {
    try {
      const v = JSON.parse(load(CLOCK_KEY)) as Clock;
      if (typeof v.elapsed === "number") return v;
    } catch {
      // nothing stored yet
    }
    return { elapsed: 0, since: null };
  });
  const [armed, setArmed] = useState(false);
  const save = (next: Clock) => {
    setC(next);
    store(CLOCK_KEY, JSON.stringify(next));
  };
  const total = (c.elapsed + (c.since ? now - c.since : 0)) / 1000;
  const running = c.since !== null;
  const toggle = () => save(running ? { elapsed: c.elapsed + (Date.now() - c.since!), since: null } : { elapsed: c.elapsed, since: Date.now() });
  const reset = () => {
    if (!armed) {
      setArmed(true);
      window.setTimeout(() => setArmed(false), 2500);
      return;
    }
    setArmed(false);
    save({ elapsed: 0, since: null });
  };
  return (
    <div className="flex h-10 items-stretch border border-border">
      <div className="flex flex-1 items-baseline gap-2 self-center px-3">
        <span className="text-[11px] tracking-wide text-muted uppercase">{running ? "talk" : total > 0 ? "paused" : "talk clock"}</span>
        <span className={["text-lg font-medium tabular-nums", running ? "text-fg" : "text-muted"].join(" ")}>{clock(total)}</span>
      </div>
      <button type="button" onClick={toggle} className={["w-24 border-0 border-l border-border text-sm font-medium", running ? "bg-surface text-fg" : "bg-fg text-bg"].join(" ")} style={square}>
        {running ? "Pause" : total > 0 ? "Continue" : "Start"}
      </button>
      <button type="button" onClick={reset} disabled={total === 0} className={["w-16 border-0 border-l border-border text-sm disabled:opacity-35", armed ? "text-bg" : "bg-transparent text-muted"].join(" ")} style={{ ...square, ...(armed ? { background: "#ff796b" } : {}) }}>
        {armed ? "Sure?" : "Reset"}
      </button>
    </div>
  );
}

function Header({ deck, live, connected, onMenu }: { deck: DeckState | null; live: boolean; connected: boolean; onMenu?: () => void }) {
  const now = useNow();
  const onSlide = deck ? (now - deck.slideStartedAt) / 1000 : 0;
  const planned = deck?.plan ? deck.plan.end - deck.plan.start : null;
  const over = planned !== null && onSlide > planned;
  return (
    <header className="flex flex-col gap-2 border-b border-border pb-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className={["inline-block h-2 w-2", live ? "bg-accent" : connected ? "bg-muted" : "bg-border"].join(" ")} aria-hidden="true" />
        <span aria-live="polite">{live ? "connected" : connected ? "no deck open" : "connecting…"}</span>
        {deck && (
          <span className={["ml-auto tabular-nums", over ? "text-accent" : ""].join(" ")}>
            {clock(onSlide)}
            {planned !== null && ` / ${clock(planned)}`}
          </span>
        )}
      </div>
      {deck ? (
        <button type="button" onClick={onMenu} className="flex items-baseline gap-3 border-0 bg-transparent p-0 text-left text-fg" style={square}>
          <span className="shrink-0 text-sm text-muted tabular-nums">{deck.index + 1}/{deck.count}</span>
          <span className="min-w-0 flex-1 truncate text-xl font-medium tracking-tight">{deck.title || "Untitled slide"}</span>
          <span className="shrink-0 text-sm text-accent">Slides</span>
        </button>
      ) : (
        <p className="m-0 text-xl font-medium tracking-tight text-muted">Waiting for the deck</p>
      )}
      {deck && deck.steps > 0 && (
        <div className="flex gap-1" aria-label={`step ${Math.min(deck.step, deck.steps) + 1} of ${deck.steps + 1}`}>
          {Array.from({ length: deck.steps + 1 }, (_, i) => (
            <span key={i} className={["h-1 flex-1", i <= deck.step ? "bg-accent" : "bg-border"].join(" ")} />
          ))}
        </div>
      )}
    </header>
  );
}

function NavButton({ label, sub, onClick, disabled, accent }: { label: string; sub: string; onClick: () => void; disabled?: boolean; accent?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={["flex min-h-20 flex-col items-start justify-end px-4 py-3 text-left disabled:opacity-35", accent ? "bg-accent text-accent-fg" : "bg-surface text-fg"].join(" ")}
      style={square}
    >
      <span className={["text-xs", accent ? "opacity-70" : "text-muted"].join(" ")}>{sub}</span>
      <span className="text-xl font-medium tracking-tight">{label}</span>
    </button>
  );
}

// Pointer feel, tuned like macOS acceleration: slow finger movement is precise (about 2.4 stage
// pixels per phone pixel, so small targets are easy), a quick flick travels further (up to 7×),
// with a smooth ramp in between, and both axes use the same pixel scale.
const STAGE = { w: 1280, h: 720 };
const GAIN = { slow: 2.4, fast: 7, from: 0.08, to: 1.4 }; // speeds in phone px per ms
const gainFor = (v: number) => {
  const t = Math.min(1, Math.max(0, (v - GAIN.from) / (GAIN.to - GAIN.from)));
  return GAIN.slow + (GAIN.fast - GAIN.slow) * t * t * (3 - 2 * t);
};
const SCROLL_GAIN = 2.2;

/**
 * A laptop-style trackpad: one finger moves the pointer (relative, accelerated), a quick tap
 * clicks, two fingers scroll whatever is under the pointer (natural direction, like a Mac).
 * Updates go out at most once per frame.
 */
function Trackpad({ onPoint, onScroll, disabled }: {
  onPoint: (p: { x: number; y: number; click?: boolean; hide?: boolean }) => void;
  onScroll: (s: { x: number; y: number; dx: number; dy: number }) => void;
  disabled: boolean;
}) {
  const pos = useRef({ x: 0.5, y: 0.5 });
  const fingers = useRef(new Map<number, { x: number; y: number; t: number }>());
  const tap = useRef<{ t: number; moved: number; multi: boolean } | null>(null);
  const pending = useRef({ move: false, sx: 0, sy: 0 });
  const frame = useRef(0);

  const flush = () => {
    frame.current = 0;
    const p = pending.current;
    if (p.move) onPoint({ x: pos.current.x, y: pos.current.y });
    if (p.sx || p.sy) onScroll({ x: pos.current.x, y: pos.current.y, dx: Math.round(p.sx), dy: Math.round(p.sy) });
    pending.current = { move: false, sx: 0, sy: 0 };
  };
  const schedule = () => {
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  };

  const down = (e: ReactPointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (fingers.current.size === 1) {
      tap.current = { t: e.timeStamp, moved: 0, multi: false };
      onPoint({ x: pos.current.x, y: pos.current.y });
    } else if (tap.current) tap.current.multi = true;
  };
  const move = (e: ReactPointerEvent) => {
    const f = fingers.current.get(e.pointerId);
    if (!f) return;
    const dx = e.clientX - f.x, dy = e.clientY - f.y;
    const dt = Math.max(1, e.timeStamp - f.t);
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (tap.current) tap.current.moved += Math.abs(dx) + Math.abs(dy);
    if (fingers.current.size >= 2) {
      // Each finger reports its own move; average them by splitting the delta between fingers.
      const n = fingers.current.size;
      pending.current.sx += (-dx * SCROLL_GAIN) / n;
      pending.current.sy += (-dy * SCROLL_GAIN) / n;
      schedule();
      return;
    }
    const g = gainFor(Math.hypot(dx, dy) / dt);
    pos.current = {
      x: Math.min(1, Math.max(0, pos.current.x + (dx * g) / STAGE.w)),
      y: Math.min(1, Math.max(0, pos.current.y + (dy * g) / STAGE.h)),
    };
    pending.current.move = true;
    schedule();
  };
  const up = (e: ReactPointerEvent) => {
    fingers.current.delete(e.pointerId);
    if (fingers.current.size > 0) return;
    const t = tap.current;
    tap.current = null;
    if (t && !t.multi && t.moved < 6 && e.timeStamp - t.t < 220) onPoint({ x: pos.current.x, y: pos.current.y, click: true });
  };

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div
        onPointerDown={disabled ? undefined : down}
        onPointerMove={disabled ? undefined : move}
        onPointerUp={disabled ? undefined : up}
        onPointerCancel={(e) => {
          fingers.current.delete(e.pointerId);
          tap.current = null;
        }}
        className={["relative flex flex-1 items-center justify-center border border-border bg-surface", disabled ? "opacity-35" : ""].join(" ")}
        style={{ touchAction: "none", backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        aria-label="Trackpad: drag to move the pointer, tap to click, two fingers to scroll"
        role="application"
      >
        <span className="pointer-events-none text-center text-sm text-muted">drag to move · tap to click<br />two fingers to scroll</span>
      </div>
      <button type="button" onClick={() => onPoint({ ...pos.current, hide: true })} className="self-end border-0 bg-transparent p-0 text-xs text-muted" style={square}>
        hide pointer
      </button>
    </div>
  );
}

function SlideMenu({ deck, onPick, onClose }: { deck: DeckState; onPick: (index: number) => void; onClose: () => void }) {
  const current = useRef<HTMLButtonElement>(null);
  useEffect(() => current.current?.scrollIntoView({ block: "center" }), []);
  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Jump to a slide">
      <div className="flex items-center justify-between border-b border-border px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3">
        <span className="text-lg font-medium tracking-tight">Slides</span>
        <button type="button" onClick={onClose} className="border border-border bg-transparent px-4 py-2 text-sm text-fg" style={square}>
          Close
        </button>
      </div>
      <ol className="m-0 flex-1 list-none overflow-y-auto p-0 pb-[env(safe-area-inset-bottom,0px)]">
        {deck.titles.map((t, i) => (
          <li key={i}>
            <button
              ref={i === deck.index ? current : undefined}
              type="button"
              onClick={() => onPick(i)}
              className={["flex w-full items-baseline gap-4 border-0 border-b border-border px-4 py-3.5 text-left", i === deck.index ? "bg-surface text-accent" : "bg-transparent text-fg"].join(" ")}
              style={square}
            >
              <span className="w-7 shrink-0 text-sm text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base leading-snug">{t || "Untitled slide"}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
