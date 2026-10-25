import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useRemoteSender, type DeckState } from "@talks/slide-engine";

const edge = { borderWidth: "3px", borderRadius: 0 } as const;
const PASSWORD_KEY = "slides.remote.password";
const CLOCK_KEY = "slides.remote.talkStartedAt";

function load(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function store(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
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

export function Remote() {
  const [password, setPassword] = useState(() => load(PASSWORD_KEY));
  const { status, send, notesAllowed, deck } = useRemoteSender(password);
  const ready = status.connected && status.decks > 0;
  const line = !status.connected
    ? "Connecting…"
    : ready
      ? `${status.decks} deck${status.decks === 1 ? "" : "s"} listening`
      : "Open a talk on the presenter";

  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-8">
        <header className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
          <p className="m-0 text-sm text-muted" aria-live="polite">
            {line}
          </p>
          <Link to="/" className="shrink-0 text-sm text-muted no-underline hover:text-fg">
            All talks
          </Link>
        </header>

        {notesAllowed === false ? (
          <PasswordForm
            wrong={password !== ""}
            onSubmit={(value) => {
              store(PASSWORD_KEY, value);
              setPassword(value);
            }}
          />
        ) : deck ? (
          <Timing deck={deck} />
        ) : (
          <p className="m-0 text-muted">Waiting for the presenter to open a talk.</p>
        )}

        <div className="mt-auto flex flex-col gap-0">
          <button
            type="button"
            disabled={!status.connected}
            onClick={() => send("prev")}
            className="min-h-16 border-border bg-surface px-6 text-left text-xl font-bold tracking-tighter text-fg disabled:opacity-35"
            style={edge}
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={!status.connected}
            onClick={() => send("next")}
            className="-mt-[3px] min-h-32 border-border bg-accent px-6 text-left text-3xl font-bold tracking-tighter text-accent-fg disabled:opacity-35"
            style={edge}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}

function Timing({ deck }: { deck: DeckState }) {
  const now = useNow();
  const [talkStartedAt, setTalkStartedAt] = useState(() => Number(load(CLOCK_KEY)) || 0);
  const { plan } = deck;

  const onSlide = (now - deck.slideStartedAt) / 1000;
  const over = plan !== null && onSlide > plan.end - plan.start;
  const talk = talkStartedAt ? (now - talkStartedAt) / 1000 : null;
  const drift =
    talk === null || plan === null
      ? null
      : talk > plan.end
        ? { text: `${clock(talk - plan.end)} behind`, late: true }
        : talk < plan.start
          ? { text: `${clock(plan.start - talk)} ahead`, late: false }
          : { text: "on plan", late: false };

  const toggleClock = () => {
    const next = talkStartedAt ? 0 : Date.now();
    store(CLOCK_KEY, next ? String(next) : null);
    setTalkStartedAt(next);
  };

  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="m-0 truncate text-lg font-bold tracking-tighter">
          <span className="text-muted">{deck.index + 1}/{deck.count}</span> {deck.title || "Untitled slide"}
        </p>
        {deck.steps > 0 && (
          <span className="shrink-0 font-mono text-sm text-muted">
            step {Math.min(deck.step, deck.steps) + 1}/{deck.steps + 1}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 font-mono">
        <span className={["text-6xl font-bold tabular-nums tracking-tighter", over ? "text-accent" : ""].join(" ")}>{clock(onSlide)}</span>
        {plan && <span className="text-2xl text-muted tabular-nums">/ {clock(plan.end - plan.start)}</span>}
      </div>

      <div className="flex items-center justify-between gap-3 font-mono text-sm">
        <span className="flex gap-3">
          {talk !== null ? <span className="tabular-nums">talk {clock(talk)}</span> : <span className="text-muted">talk clock off</span>}
          {drift && <span className={drift.late ? "font-bold text-accent" : "text-muted"}>{drift.text}</span>}
        </span>
        <button type="button" onClick={toggleClock} className="border-0 bg-surface px-3 py-1.5 font-mono text-sm text-fg">
          {talkStartedAt ? "reset" : "start talk"}
        </button>
      </div>

      <div className="flex flex-col gap-1 border-border bg-surface px-4 py-3" style={{ borderWidth: "var(--se-border-width)" }}>
        <span className="text-xs font-bold tracking-tighter text-muted uppercase">Next slide</span>
        <span className="text-xl leading-tight font-bold tracking-tighter">{deck.next || "End of talk"}</span>
      </div>
    </section>
  );
}

function PasswordForm({ wrong, onSubmit }: { wrong: boolean; onSubmit: (password: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value) onSubmit(value);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="remote-password" className="text-base text-muted">
        {wrong ? "That password didn't unlock the timer. Try again." : "Enter the deck password to see the slide timer."}
      </label>
      <div className="flex gap-0">
        <input
          id="remote-password"
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-0 flex-1 border-border bg-surface px-3 py-3 text-base text-fg"
          style={edge}
        />
        <button type="submit" className="shrink-0 border-0 bg-accent px-5 font-bold text-accent-fg">
          Unlock
        </button>
      </div>
    </form>
  );
}
