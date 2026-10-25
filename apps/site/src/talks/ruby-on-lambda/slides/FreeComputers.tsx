import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Offer } from "./companions/Offer";

export function FreeComputersSlide() {
  return (
    <Slide title={"Amazon gives you computers for free"} hideTitle layout="wide" className="ruby-slide ruby-slide-offer">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"04 / The twist"}</p>
          <h2>{"Amazon gives you computers for free*"}</h2>
          <p className="ruby-subtitle">{"Tiny ones. They start when someone calls and vanish when the work is done."}</p>
          <p className="ruby-footnote">{"* Lambda always-free tier: 1M requests and 400,000 GB-seconds a month; one run lasts at most 15 minutes. Memory is 128 MB to 10 GB, and CPU grows with it, up to 6 vCPUs. DynamoDB and SQS have free allowances too."}</p>
        </div>
        <SteppedScene cues={["Computers on demand, nothing to pay when idle", "Fifteen minutes, small or large"]} still={3}>
          {(t, step) => <Offer t={t} step={step} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"But Amazon does give you computers. Tiny ones. Lambda is a micro VM that starts when a request arrives, does the work, and goes away. A run can last up to fifteen minutes. You pay per call, and the first million calls every month are free."}</p>
        <p>{"When traffic spikes, Lambda runs many of them side by side; when nobody calls, nothing runs and the bill stays at zero. A small CRUD API with thousands of users can live inside the free tier."}</p>
        <p>{"It's not just compute. DynamoDB gives you a database and SQS gives you a queue with workers, both with free allowances. Cloudflare and Vercel have similar ideas, but AWS runs a large part of the internet, Lambda has been around since 2014, and the free tier has survived every pricing change so far. It is here to stay."}</p>
        <p>{"If asked: accounts opened since July 2025 start on a credits-based Free plan that closes after six months unless you upgrade; the always-free monthly allowances apply on both plans."}</p>
        <p>{"Press. Each of these computers lives up to fifteen minutes. That's plenty: boot the program, serve requests, or crunch a long job. And you pick the size. Cheems is the small function: a slice of one CPU, perfect for serving simple requests. Swole Doge is the large one: ten gigabytes and six CPUs, enough to run an AI agent inside for the whole fifteen minutes. Same Ruby, different dog."}</p>
        <p>{"And yes, it runs Ruby. No question mark. The next slide is where people actually use it."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"Computers on demand: spikes scale out, idle costs nothing, a free database and queue beside them."}</li>
          <li>{"Fifteen minutes, small or large: Cheems serves simple requests, Swole Doge runs AI agents."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://aws.amazon.com/lambda/pricing/" target="_blank" rel="noopener noreferrer">{"AWS Lambda pricing (free tier)"}</a></p>
        <p><a href="https://aws.amazon.com/blogs/aws/aws-free-tier-update-new-customers-can-get-started-and-explore-aws-with-up-to-200-in-credits" target="_blank" rel="noopener noreferrer">{"AWS Free Tier update, July 2025"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html" target="_blank" rel="noopener noreferrer">{"Lambda memory and CPU (128 MB–10 GB, up to 6 vCPUs)"}</a></p>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html" target="_blank" rel="noopener noreferrer">{"Lambda quotas (15-minute timeout)"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
