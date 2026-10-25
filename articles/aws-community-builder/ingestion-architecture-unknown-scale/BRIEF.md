# Article 1 — Choosing a Data Ingestion Architecture When You Don't Know Your Scale Yet

**Type:** decision / architecture article. **Role:** reach.

## Title

Preferred:

> **SQS, Lambda, Containers, or Kafka? Designing Data Ingestion When Scale Is Unknown**

Searchable, useful, not clickbait. Alternatives if needed:

- How I Choose an AWS Data Ingestion Architecture When Traffic Is Unknown
- Building Data Ingestion Without Overengineering: From SQS to Kafka
- You Probably Don't Need Kafka Yet
- Start With a Queue, Not a Streaming Platform

## Angle

Not "here are some AWS ingestion services". The premise is:

> You're building a new tracking/data ingestion system. Traffic is uncertain,
> the budget matters, and you don't know whether the product will serve 10
> customers or 10,000. What architecture gives you the best path without
> prematurely buying complexity?

Credibility comes from real experience: a tracking system across multiple
e-commerce brands where the deliberate choice was queue-based ingestion +
compute, not Kafka or serverless by reflex. Moderate production scale, stated
honestly — "what worked at moderate production scale" beats invented
internet-scale credentials.

## Thesis

> The best architecture for an early ingestion system isn't the one that can
> handle the most traffic. It's the one that preserves reliability while
> minimizing operational cost and complexity, and gives you a clear migration
> path when your assumptions stop being true.

Decision principle: **optimize for the current uncertainty, not hypothetical
maximum scale.**

## Scenario

```text
Browser / Application
        ↓
 Event ingestion API
        ↓
      Queue
        ↓
 Event processing
        ↓
 Customer / profile / analytics storage
```

Events: page viewed, product viewed, cart updated, checkout started, order
completed, identity resolved, attribution event. No proprietary details.

Suggested framing sentence:

> I faced this problem while building an ingestion system used for tracking
> events from multiple e-commerce brands. The workload wasn't hyperscale, but it
> was production traffic: continuous ingestion, traffic spikes, failures that
> couldn't simply lose customer events, and a budget that didn't justify
> operating heavyweight streaming infrastructure.

## Key framing: throughput is not the only variable

People compare on requests/sec, latency, throughput. Early systems care about:

```text
Operational complexity     Failure semantics       Vendor coupling
Minimum monthly cost       Replayability           Autoscaling behaviour
Idle cost                  Ordering requirements   Observability
Deployment speed           Batch processing        Team familiarity
Debugging ergonomics       Processing duration
Local development
```

Candidate for the strongest section — it's where the experience shows.

## Option A — SQS + Lambda

Do not attack Lambda. Explain when it's genuinely excellent.

Advantages: near-zero infrastructure burden; SQS negligible at low traffic;
scales from nothing; no servers; retries/DLQ/visibility timeout/concurrency/
alarms already solved. Compelling for a prototype.

When it's probably the right answer:

> If I were starting a new ingestion prototype today with little certainty
> about traffic, Lambda would be one of the first architectures I'd evaluate.

Especially when processing is short-lived, events are independent, runtime
dependencies are simple, traffic is bursty, idle cost matters, the team knows
AWS serverless, and the workload fits Lambda's execution model.

**Lambda changes the programming model.** Instead of

```go
for {
    msg := queue.Receive()
    process(msg)
}
```

you write around the invocation model: handler contracts, batch failure
semantics, execution limits, cold starts, deployment packaging, runtime
restrictions, local emulation, AWS-specific event structures. Not bad — but an
architectural cost of serverless execution semantics.

**The 15-minute limit:** mention, don't overemphasize. The stronger argument:

> Lambda works best when the workload naturally fits the Lambda execution
> model. When processing becomes long-running, stateful, dependency-heavy,
> compute-intensive, or operationally unusual, forcing it into Lambda can
> create more complexity than simply running a worker process.

## Option B — SQS + container workers (the heart of the article)

```text
Producers → SQS → Container workers → Database
```

Queue = durable boundary. Workers = disposable compute.

The important architecture is **not** "Kubernetes + Spot". It is
**durable queue + disposable workers.** Once you have that separation, compute
is replaceable: EC2, ECS, EKS, Fargate, Spot, on-prem. Durability lives
elsewhere.

Recurring motif:

> Treat compute as ephemeral. Treat the queue and datastore as the durable
> system.

Developer ergonomics: the production worker can be the same program you run
locally (`./consumer`) versus handler + SQS integration + runtime + event
wrapper + deployment package. Not inherently better — sometimes simpler,
especially for teams already running containers.

## Option C — Kafka / MSK / streaming platform

The question isn't "can Kafka handle this?" (yes). It's:

> **Which requirement do I currently have that requires Kafka?**

Legitimate reasons: multiple independent consumers, long-lived retention,
reprocessing historical streams, partition ordering, very high sustained
throughput, stream-processing ecosystems (Flink, Kafka Streams), complex
pipelines. Without those, Kafka is expensive infrastructure.

Small conceptual section — **queue vs event log**: SQS is a work queue; Kafka is
a durable distributed event log. Overlapping but fundamentally different
problems.

## Decision boundaries (not benchmarks)

Never "Lambda = X req/s, Kafka = Y". Instead:

**Start with Lambda when:** you want near-zero operations; traffic is
unknown/bursty; processing is independent and short; AWS coupling is
acceptable.

**Consider queue + containers when:** you want conventional application
processes; workers need richer dependencies/runtime behaviour; you already
operate containers; you want control over compute cost; workloads are
sustained enough that serverless economics fade.

**Consider Kafka when:** events themselves become infrastructure; multiple
systems need durable replay; ordering/retention are product requirements;
throughput/topology justifies the operational burden.

## Cost shape (no exact pricing needed)

- Lambda: cost follows work. Idle → nearly nothing; more work → executions +
  duration.
- Containers: cost follows provisioned compute. Idle → still paying; sustained
  → economically attractive.
- Spot containers: much cheaper compute + interruption risk. **This is the
  bridge to Article 2.**

## Where Kubernetes fits

> Kubernetes is often dismissed as overkill, but the answer depends on whether
> Kubernetes is already part of your operating environment.

Deploying Kubernetes *only* for one SQS consumer is likely overkill. If you
already have a cluster, monitoring, deployment tooling, autoscaling, secrets,
networking, and familiarity, adding one workload can be simpler than
introducing a separate operational paradigm.

Karpenter — not a tutorial, just the shape:

```text
workload increases → pods unschedulable → Karpenter provisions nodes
→ workers drain backlog → capacity unnecessary → nodes disappear
```

Then: "Once the workers themselves are disposable, Spot becomes particularly
interesting." **Stop there.** Resilience implementation is Article 2.

## Go — only a little

One selection dimension: deployment and build ergonomics. Go gave a single
binary, fast compilation, small container, few runtime dependencies. Contrast
with Node/Python pipelines (native deps, dependency resolution, transpilation).

Avoid "Go has SSL built in therefore better" (invites pedantry). Use:

> For our workers, Go produced simple deployable binaries and fast container
> builds, which made iteration on inexpensive CI runners noticeably easier.

## Observability — at the decision level only

> Operational ergonomics should be part of architecture selection from the
> beginning. Don't choose an architecture you cannot understand while it is
> running.

Selection criteria: Can I identify a failed event quickly? Correlate it with a
trace? See queue backlog? Processing latency? Understand retries? Identify
poison messages? Deploy a fix quickly?

## Outline

1. **The real problem isn't scale** — opening story: unknown traffic, limited
   budget, reliability required.
2. **Start with requirements, not services** — traffic profile, processing
   duration, delivery semantics, ordering, retention, replay, latency,
   operations, budget.
3. **The simplest architecture: durable queue + worker** — diagram; why
   decoupling compute matters.
4. **Option 1: SQS + Lambda** — benefits, constraints, who should choose it.
5. **Option 2: SQS + container workers** — conventional process model,
   deployments, sustained workloads.
6. **Option 3: Kafka/MSK** — what you're buying; why not to buy it unneeded.
7. **Where Kubernetes fits** — existing cluster vs cluster-for-one-workload;
   Karpenter.
8. **Cheap compute changes the economics** — Spot + interruption. Teaser: "You
   only get the cost advantage if your application actually tolerates losing
   the machine underneath it."
9. **Developer ergonomics are infrastructure economics too** — build speed,
   deployment speed, local execution, debugging, observability; Go.
10. **A practical decision tree:**

```text
Need event replay / multiple independent stream consumers?
   YES → Kafka/MSK worth evaluating
   NO  ↓
Does the workload fit naturally into Lambda?
   YES → SQS + Lambda
   NO  ↓
Already operate containers / need a conventional runtime?
   YES → SQS + containers
         ↓
      Can workers tolerate interruption?
         YES → Spot becomes interesting
```

Closing handoff:

> For sustained workloads, containers running on Spot can become economically
> attractive — but only if the application is designed to tolerate
> interruption. That's a deeper topic I'll cover separately.

## Open questions to answer before drafting

**Traffic:** approximate events/sec, average vs peak, campaign spikes, payload
size (tiny JSON?), typical processing duration.

**Queue:** Standard or FIFO? Batch size? Long polling? Visibility timeout?
Failed-message handling, DLQ, retry count?

**Lambda:** Was it actually prototyped? If yes, what pushed toward workers —
economics, ergonomics, execution time, deployment model? If not, frame the
section as architectural comparison, not migration.

**Kafka:** Seriously evaluated, or retrospective comparison? Distinguish
experience from analysis.

**Kubernetes:** Was EKS already running for other services, or built mainly
for this platform? This decides the strength of the "not overkill" argument.

**Costs:** rough monthly range (<$100 / $100–500 / $500+).

**Scale:** events per month, order of magnitude (millions / tens of millions /
hundreds of millions).

## Not in this article (belongs to Article 2)

Idempotency and atomic writes, visibility-timeout tuning, batch-acknowledgement
semantics, graceful shutdown, poison messages/DLQ mechanics, OpenTelemetry
implementation, error-propagation code, the interruption timeline, why Go fit
the worker (beyond one ergonomics paragraph).

## What not to do

- No filler ("AWS Lambda is great for serverless workloads").
- No 600 words explaining what SQS is.
- Don't claim Kafka is bad or Kubernetes is always simple.
- Don't claim internet scale.
- Don't drown it in code. The value is the **decision framework**.
