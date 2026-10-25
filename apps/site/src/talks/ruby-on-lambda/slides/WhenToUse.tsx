import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { WhenToUse } from "./companions/WhenToUse";

export function WhenToUseSlide() {
  return (
    <Slide title={"Serverless is a tool for bursts"} hideTitle layout="wide" className="ruby-slide ruby-band ruby-slide-when">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"18 / Know when to use it"}</p>
          <h2>{"Serverless is a tool for bursts"}</h2>
          <p className="ruby-subtitle">{"Spiky, unpredictable traffic: Lambda. A steady hum: a server is cheaper and simpler. Either way, know the terrain before you walk it."}</p>
        </div>
        <SteppedScene cues={["Bursty traffic: Lambda wins", "Steady traffic: a server wins"]} still={3}>
          {(t, step, since) => <WhenToUse t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"Let's be honest about what this is. Lambda is a tool. Bringing it into a Ruby room, where we like things simple and things that just work, is a bit crazy. To use it well you need system design, and you need to get your hands dirty in the cloud."}</p>
        <p>{"This is a month of traffic. One ridge per day. Right now it's bursty: a launch, a big import, webhook storms, and quiet nights. A server has to be sized for that peak, so it sits idle almost all the time. Lambda bills only the spikes. Lambda wins."}</p>
        <p>{"But look at the pins. Every spike is dozens of cold starts at once. There's a concurrency quota, a thousand copies per account by default. Every copy opens its own Postgres connection, so you need RDS Proxy, and RDS means a VPC, and a VPC means a NAT gateway just to call Stripe. A two-gigabyte import hits the fifteen-minute cap. The fixes are real: SQS in front to drain the burst, CloudFront or Cloudflare caching before Lambda even wakes."}</p>
        <p>{"Press. Now watch it flatten. Same app, steady traffic, busy all day. The server is sixty percent busy and costs less. Per-request pricing adds up when every minute has requests. Each copy warms its own cache. CloudWatch bills your logs per gigabyte. Kamal and a VPS just work."}</p>
        <p>{"And yet: a lot of startups already live in AWS. Funded startups get credits, and nobody wants an ops hire patching servers. So the point isn't 'never'. It's: know when to use it. Bursty and unpredictable, use Lambda. Predictable at scale, run a server."}</p>
        <p>{"For Q&A: the cost bars are shapes, not prices. The 1,000-copy concurrency quota is a per-Region default and can be raised. Startup credits depend on the program, for example AWS Activate."}</p>
        <h3>References</h3>
        <p><a href="https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html" target="_blank" rel="noopener noreferrer">{"Lambda quotas"}</a></p>
        <p><a href="https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html" target="_blank" rel="noopener noreferrer">{"RDS Proxy"}</a> · <a href="https://aws.amazon.com/vpc/pricing/" target="_blank" rel="noopener noreferrer">{"NAT gateway pricing"}</a></p>
        <p><a href="https://aws.amazon.com/startups/credits" target="_blank" rel="noopener noreferrer">{"AWS Activate credits"}</a> · <a href="https://kamal-deploy.org/" target="_blank" rel="noopener noreferrer">{"Kamal"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
