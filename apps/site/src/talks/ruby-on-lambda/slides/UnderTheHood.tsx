import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { UnderTheHood } from "./companions/UnderTheHood";

export function UnderTheHoodSlide() {
  return (
    <Slide title={"A runtime is a loop that calls your code"} hideTitle layout="wide" className="ruby-slide ruby-stage ruby-slide-runtime">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"14 / Under the hood"}</p>
          <h2>{"A runtime is a loop that calls your code"}</h2>
          <p className="ruby-subtitle">{"Inside every copy: Linux, Ruby, your gems, and one small program that fetches the next event and hands it to your handler."}</p>
          <p className="ruby-footnote">{"* Lambda runs whatever executable is called bootstrap. On the managed Ruby runtime that's AWS's own runtime client; its API address is in AWS_LAMBDA_RUNTIME_API."}</p>
        </div>
        <SteppedScene
          cues={["Inside a copy: bootstrap runs the loop", "Who ships and patches each layer", "Native gems have to be built for Linux", "A custom runtime: write the loop yourself"]}
          still={3.6}
          wideFrom={1}
        >
          {(t, step, since) => <UnderTheHood t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Let's open one copy up. It's a Firecracker micro VM running Amazon Linux. On top: Ruby, your gems, your code. And one more thing on top of that, a program called bootstrap."}</p>
        <p>{"Watch the loop. A request reaches the Lambda service and waits there. bootstrap asks for work with GET next, gets the event, calls your handler, and posts whatever you returned. Then it asks again, and until the next event shows up the whole VM is frozen. That's the job Puma did for us on a server. Here it's bootstrap, and it talks HTTP to a local endpoint."}</p>
        <p>{"Press. So who owns which layer? With the managed runtime, ruby3.4, AWS ships and patches Linux, Ruby and bootstrap; you upload a zip with your code and vendor/bundle. With a container image you ship everything, and aws_lambda_ric is the bootstrap. With a custom runtime on provided.al2023, AWS only gives you Linux: you bring Ruby, usually as a layer, and you write the loop."}</p>
        <p>{"Press. The packaging problem that actually bites Ruby people: native gems. Run bundle install on a Mac and vendor/bundle is full of macOS binaries. nokogiri ships prebuilt gems per platform, so tell Bundler about Linux with bundle lock add-platform. bcrypt compiles C on install, so build inside a Linux image, for example sam build with use-container. pg is the worst: it links libpq, a system library that isn't on Lambda at all, so you ship it in a layer or move to a container image."}</p>
        <p>{"Press. And the custom runtime. This is all of it, minus error handling: read the API address from the environment, loop, GET next, call the handler, POST the response. Real runtimes also post to an error endpoint, pass a context object with the deadline, and report init errors. But that's the whole contract: three endpoints and a few headers. Once you've seen this, 'does Lambda support language X' stops being a question."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"Anatomy of a copy, and the loop."}</li>
          <li>{"Managed runtime, container image, custom runtime: who owns what."}</li>
          <li>{"Native gems: nokogiri, bcrypt, pg."}</li>
          <li>{"A custom runtime in fourteen lines."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html" target="_blank" rel="noopener noreferrer">{"Custom runtime contract"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html" target="_blank" rel="noopener noreferrer">{"Lambda Runtime API"}</a></p>
        <p><a href="https://github.com/aws/aws-lambda-ruby-runtime-interface-client" target="_blank" rel="noopener noreferrer">{"aws_lambda_ric"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/ruby-package.html" target="_blank" rel="noopener noreferrer">{"Deploying Ruby Lambda functions with .zip archives"}</a></p>
        <p><a href="https://bundler.io/man/bundle-lock.1.html" target="_blank" rel="noopener noreferrer">{"bundle lock --add-platform"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
