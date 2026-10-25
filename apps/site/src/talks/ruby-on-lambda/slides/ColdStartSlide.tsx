import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { ColdStart } from "./companions/ColdStart";

export function ColdStartSlide() {
  return (
    <Slide title={"The first request boots all of Rails"} hideTitle layout="wide" className="ruby-slide ruby-slide-coldstart">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"07 / The catch"}</p>
          <h2>{"The first request boots all of Rails"}</h2>
          <p className="ruby-subtitle">{"Your code is the last thirty milliseconds."}</p>
          <p className="ruby-footnote">{"* Illustrative split and counts for a mid-size Rails app. Measure yours: Init Duration in the REPORT log line, $LOADED_FEATURES.size, Rails.application.initializers.size. The init phase is capped at 10 seconds and billed since August 2025."}</p>
        </div>
        <SteppedScene cues={["The platform starts a VM and Ruby", "Bundler resolves, Ruby requires every gem", "Rails runs initializers and eager-loads the app", "First request: Rack env, DB, templates, then your code"]} still={3}>
          {(t, step, since) => <ColdStart t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Here's what the first request actually waits for. Lambda has a Ruby runtime and it will run the thing, but look at everything that happens before your handler."}</p>
        <p>{"Press. Lambda starts a Firecracker micro VM, fetches the image or layers, the runtime client bootstraps, and the Ruby VM and RubyGems come up. Half a second and we haven't touched our code."}</p>
        <p>{"Press. Bundler reads Gemfile.lock and builds the load path. Then require, gem after gem. Every stripe in that bar is one file: Ruby finds it on the load path, reads it, parses it, compiles it to YARV bytecode, and runs its top level, which defines classes and methods. activesupport alone is hundreds of files. Bootsnap can cache the path lookups and the compiled bytecode; without it, this is all paid on every cold start."}</p>
        <p>{"Press. Rails runs its initializers: your application config, locales, Active Record, Action Dispatch, then everything in config/initializers. In production it eager-loads: Zeitwerk walks app/models, controllers, jobs, lib, and loads every constant. That's where Rails' metaprogramming runs: associations, callbacks, define_method, concerns mixed in. Then routes are drawn and the middleware stack is built."}</p>
        <p>{"Press. Finally the request. lamby turns the Lambda event into a Rack env. The first query opens the database connection and loads the schema: column types for every table it touches. The first render compiles ERB templates to Ruby. And then, thirty milliseconds of your code. Everything to the left of it is the cold start; the next request on this copy is just the thirty milliseconds."}</p>
        <p>{"The numbers are illustrative proportions, not a benchmark. If asked: read Init Duration from the REPORT log line, and print $LOADED_FEATURES.size and Rails.application.initializers.size in a console to get your own counts. Lambda caps the init phase at ten seconds and has billed it since August 2025."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"VM, image, runtime client, Ruby VM."}</li>
          <li>{"Bundler, then every gem: one stripe per required file."}</li>
          <li>{"Initializers, Zeitwerk eager load, routes and middleware."}</li>
          <li>{"lamby, DB connect and schema, template compile, then your code."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html" target="_blank" rel="noopener noreferrer">{"Lambda execution environment lifecycle (init phase, 10-second limit)"}</a></p>
        <p><a href="https://guides.rubyonrails.org/autoloading_and_reloading_constants.html#eager-loading" target="_blank" rel="noopener noreferrer">{"Rails guides: eager loading with Zeitwerk"}</a></p>
        <p><a href="https://github.com/Shopify/bootsnap" target="_blank" rel="noopener noreferrer">{"Bootsnap: caching load paths and compiled bytecode"}</a></p>
        <p><a href="https://source.coveo.com/2024/10/28/dealing-with-lambda-cold-start-in-real-time-data-pipeline/" target="_blank" rel="noopener noreferrer">{"Coveo: dealing with Lambda cold start (most init time was their own code)"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
