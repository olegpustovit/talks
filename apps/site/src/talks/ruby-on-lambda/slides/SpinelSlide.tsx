import { Slide, SpeakerNote, SteppedScene, useSlideIsActive } from "@talks/slide-engine";
import { BrowserFrame, ENDPOINT } from "./companions/BrowserFrame";
import { Spinel } from "./companions/Spinel";

// Measured on the deployed demo (demo/spinel-lambda, `make logs`), 22 October 2026, arm64, 1769 MB.
const MEASURED = [
  { value: "14–18 ms", label: "cold start, Init Duration", note: "4 cold starts" },
  { value: "4–8 ms", label: "warm request, Duration", note: "16 requests" },
  { value: "21–29 MB", label: "memory used", note: "of 1769 MB" },
  { value: "505 KB", label: "the whole binary", note: "static, arm64" },
];

// The live step lives in HTML so the iframe is a real browser window, not a picture of one.
function Live({ step }: { step: number }) {
  const active = useSlideIsActive();
  return (
    <div className="ruby-spinel-live" data-on={step === 2}>
      <BrowserFrame url={ENDPOINT?.url} title="The Spinel demo served from AWS Lambda" live={active && step === 2} />
      <div className="ruby-spinel-numbers">
        {MEASURED.map((m) => (
          <div key={m.label}><b>{m.value}</b><span>{m.label}</span><small>{m.note}</small></div>
        ))}
        <p>The illustrative Rails app on slide 7 took about 2.8 s to its first request.</p>
      </div>
    </div>
  );
}

export function SpinelSlide() {
  return (
    <Slide title={"Compiled Ruby starts in milliseconds"} hideTitle layout="wide" className="ruby-slide ruby-band ruby-slide-spinel">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"21 / Bonus: Ruby, ahead of time"}</p>
          <h2>{"Compiled Ruby starts in milliseconds"}</h2>
          <p className="ruby-subtitle">{"Spinel is Matz's ahead-of-time compiler. It turns a Ruby program into C, then into one native binary. The Lambda runtime below is all Ruby."}</p>
        </div>
        <SteppedScene cues={["Ruby in, one native binary out", "What you give up", "Live, from eu-central-1"]} still={3} wideFrom={2}>
          {(t, step, since) => (
            <div className="ruby-spinel-stack">
              <Spinel t={t} step={step} since={since} />
              <Live step={step} />
            </div>
          )}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Second bonus. Cold starts are the thing that hurt all talk. Spinel is an ahead-of-time compiler for Ruby, by Matz. It parses your program with Prism, infers the type of everything across the whole program, writes one C file, and a C compiler turns that into a native binary. At run time it needs only libc."}</p>
        <p>{"On the left is the actual bootstrap of the function I deployed this morning. There's no interpreter and no shim: this Ruby is the whole Lambda runtime loop, with its own little HTTP client on a TCP socket, JSON, and a prime sieve to give the CPU something to do. Spinel writes C, zig cross-compiles it for ARM Linux, and the result is a 505 kilobyte static binary called bootstrap."}</p>
        <p>{"Press. What you give up is the dynamic part of Ruby. No eval of strings. method_missing never fires. define_method and send only with literal names. No ObjectSpace or TracePoint. ERB templates with Ruby inside need eval, so they're out. Sockets, JSON, exceptions, heredocs and block instance_eval still work. A successful compile doesn't promise CRuby-identical behaviour, so test it."}</p>
        <p>{"Press. And here it is, live from Frankfurt. The page tells you if this request was a cold start, how many requests this copy has served, and how long the Ruby work took. Measured from Lambda's own REPORT lines: Init Duration fourteen to eighteen milliseconds over four cold starts, four to eight milliseconds per warm request, under thirty megabytes of memory. Compare that with the seconds Rails needed earlier."}</p>
        <p>{"Honest cost: it's a young compiler, it's built from source, and most gems won't compile. This is a direction, not a migration plan."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"The Ruby runtime loop and the build pipeline."}</li>
          <li>{"What Spinel can't compile."}</li>
          <li>{"The deployed function, live."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/matz/spinel" target="_blank" rel="noopener noreferrer">{"Spinel"}</a> · <a href="https://github.com/matz/spinel/blob/master/docs/limitations.md" target="_blank" rel="noopener noreferrer">{"Spinel limitations"}</a></p>
        <p>{"Demo source, build and teardown: demo/spinel-lambda in this repo (make deploy, make logs, make teardown)."}</p>
      </SpeakerNote>
    </Slide>
  );
}
