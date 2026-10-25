import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Concurrency } from "./companions/Concurrency";

export function EveryCopySlide() {
  return (
    <Slide title={"Every new copy boots Rails again"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-everycopy">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"08 / The catch, again"}</p>
          <h2>{"Every new copy boots Rails again"}</h2>
          <p className="ruby-subtitle">{"A server boots once and keeps going. On Lambda, every copy pays for the boot, and a burst starts several at once."}</p>
          <p className="ruby-footnote">{"* Illustrative: the 2.8 s boot from slide 7, spread over the requests each lane serves in this loop."}</p>
        </div>
        <SteppedScene cues={["Same traffic: one server, a fleet of copies", "Why the server tricks don't follow you to Lambda"]} still={7} wideFrom={1}>
          {(t, step, since) => <Concurrency t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Same traffic, two worlds. On top, one Puma process: it boots once, two to three seconds, then serves everything. The boot cost per request drops to almost nothing."}</p>
        <p>{"Below, Lambda copies. Two requests arrive together and nobody is free, so Lambda starts two copies, and both boot Rails from scratch. A burst means one cold start per concurrent request. Copies serve a little, get reclaimed, and new ones boot again."}</p>
        <p>{"Press. And the tricks we use to make Rails fast on a server all assume the process stays alive."}</p>
        <p>{"YJIT compiles a method after it's been called enough times. On a server that happens once and lasts for days; a Lambda copy is often gone before most methods get there."}</p>
        <p>{"Bootsnap caches compiled Ruby and load paths in tmp/cache, so a restart is quick. On Lambda the code directory is read-only and /tmp starts empty on every new copy. You can bake a cache into the image and use read-only mode, which helps, but the rest of the boot is still there."}</p>
        <p>{"The connection pool is per process. A server holds a handful of connections for everyone; Lambda opens one per copy, and a burst can run Postgres out of connections. That's why people put RDS Proxy in front."}</p>
        <p>{"preload_app! boots once and forks workers that share memory. Lambda never forks: every copy is its own micro VM and boots alone."}</p>
        <p>{"So: is Lambda just not cool for Ruby? Or are we bringing the wrong app to it?"}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"Same traffic on Puma and on Lambda copies."}</li>
          <li>{"Four tricks, each on a server and on Lambda."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://github.com/Shopify/bootsnap" target="_blank" rel="noopener noreferrer">{"Bootsnap (including read-only mode)"}</a></p>
        <p><a href="https://docs.ruby-lang.org/en/master/yjit/yjit_md.html" target="_blank" rel="noopener noreferrer">{"YJIT"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/configuration-ephemeral-storage.html" target="_blank" rel="noopener noreferrer">{"Lambda ephemeral storage (/tmp)"}</a></p>
        <p><a href="https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html" target="_blank" rel="noopener noreferrer">{"RDS Proxy"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
