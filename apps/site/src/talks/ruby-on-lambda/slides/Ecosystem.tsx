import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Ecosystem } from "./companions/Ecosystem";

export function EcosystemSlide() {
  return (
    <Slide title={"Borrow the boring parts"} hideTitle layout="wide" className="ruby-slide ruby-band ruby-slide-ecosystem">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"15 / The ecosystem"}</p>
          <h2>{"Borrow the boring parts"}</h2>
          <p className="ruby-subtitle">{"Five layers sit between an event and a working app. Each already has a Ruby answer that knows the edge cases."}</p>
        </div>
        <SteppedScene cues={["The adapter: Lamby", "The framework: small, Rack, no magic", "Persistence: DynamoDB or SQL behind a proxy", "Jobs: SQS and a worker function", "The edge: CloudFront in front"]} still={3}>
          {(t, step, since) => <Ecosystem t={t} step={step} since={since} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"That was the bottom of the stack. Now the practical part: we don't build any of this from scratch. Think of the app as cloth, woven one band at a time."}</p>
        <p>{"The adapter. Our forty-line mapper handled Function URLs. Real traffic also arrives from API Gateway REST, HTTP API v1 and v2, and load balancers, each with its own shape for headers, cookies and bodies. Lamby has already been bitten by those. It grew up around Rails, but it's a Rack adapter."}</p>
        <p>{"Press. The framework. Something small that is still Rack, so middleware works: Sinatra if you want one file everyone can read, Roda if you want a routing tree and plugins you opt into, Hanami 2 if you want structure without Rails' boot. What we're avoiding is boot-time metaprogramming that we pay for on every cold start."}</p>
        <p>{"Press. Persistence. Copies come and go, so the database must not care how many there are. DynamoDB doesn't have connections; every call is a signed HTTPS request, and IAM decides. Use the plain SDK or aws-record, design one table around your access patterns, pay on demand. If you need SQL: Sequel is light, Aurora Serverless behind RDS Proxy keeps a burst of copies from exhausting connections, and Aurora DSQL is the newer serverless option with IAM tokens."}</p>
        <p>{"Press. Jobs. Sidekiq wants a process that stays up. Here the web function sends a message to SQS, Lambda polls the queue for you and calls a worker function in batches. Lambdakiq puts ActiveJob on top with Sidekiq-style retries. Whatever still fails lands in a dead-letter queue. Delivery is at least once, so jobs must be idempotent."}</p>
        <p>{"Press. And the edge. CloudFront in front of everything: assets from S3, the Function URL behind origin access control, and Cache-Control from your Rack app decides what never reaches Lambda. Uploads go straight to S3 with presigned URLs. One gotcha: POSTs through OAC need a body hash header."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"Adapter: Lamby."}</li>
          <li>{"Framework: Sinatra, Roda, Hanami."}</li>
          <li>{"Persistence: DynamoDB, or Sequel on Aurora behind RDS Proxy, or Aurora DSQL."}</li>
          <li>{"Jobs: SQS, a worker function, Lambdakiq, a DLQ."}</li>
          <li>{"Edge: CloudFront, S3, OAC, caching."}</li>
        </ol>
        <h3>References</h3>
        <p><a href="https://lamby.cloud/docs/anatomy" target="_blank" rel="noopener noreferrer">{"Lamby: how it works"}</a></p>
        <p><a href="https://roda.jeremyevans.net/" target="_blank" rel="noopener noreferrer">{"Roda"}</a> · <a href="https://hanamirb.org/" target="_blank" rel="noopener noreferrer">{"Hanami"}</a> · <a href="https://sequel.jeremyevans.net/" target="_blank" rel="noopener noreferrer">{"Sequel"}</a></p>
        <p><a href="https://github.com/rails-lambda/lambdakiq" target="_blank" rel="noopener noreferrer">{"Lambdakiq"}</a></p>
        <p><a href="https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html" target="_blank" rel="noopener noreferrer">{"RDS Proxy"}</a> · <a href="https://rubygems.org/gems/activerecord-dsql-adapter" target="_blank" rel="noopener noreferrer">{"activerecord-dsql-adapter"}</a></p>
        <p><a href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html" target="_blank" rel="noopener noreferrer">{"CloudFront OAC for Function URLs"}</a></p>
      </SpeakerNote>
    </Slide>
  );
}
