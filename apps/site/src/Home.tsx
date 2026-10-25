import { isStaticDeployment } from "./deployment";
import { Link } from "react-router-dom";
import { talks } from "./talks/registry";

export function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <main className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16 sm:px-8 sm:py-24">
        <header className="flex flex-col gap-3 border-b border-border pb-10">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Talks</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Slide decks
          </h1>
          <p className="max-w-xl text-lg text-muted">
            I’m Oleg Pustovit. These are slides and interactive demos from my
            talks on software engineering. More writing and projects at{" "}
            <a
              href="https://olegpustovit.com"
              className="text-fg underline decoration-border underline-offset-4 hover:text-accent"
            >
              olegpustovit.com
            </a>.
          </p>
          <p className="max-w-xl text-base text-muted">
            Open a talk to present. Use arrow keys, Space, or swipe to advance.
            {!isStaticDeployment && <> Or open{" "}
            <Link to="/remote" className="text-fg underline decoration-border underline-offset-4 hover:text-accent">
              remote
            </Link>{" "}
            on your phone.</>}
          </p>
        </header>

        <ul className="flex flex-col gap-6">
          {talks.map((talk) => (
            <li key={talk.slug}>
              <Link
                to={`/t/${talk.slug}`}
                className="group flex flex-col gap-2 border-b border-border/40 pb-6 no-underline transition-colors hover:border-border"
              >
                {talk.event ? (
                  <span className="text-sm text-muted">{talk.event}</span>
                ) : null}
                <span className="text-2xl font-semibold tracking-tight text-fg group-hover:text-accent">
                  {talk.title}
                </span>
                <span className="text-base text-muted">{talk.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
