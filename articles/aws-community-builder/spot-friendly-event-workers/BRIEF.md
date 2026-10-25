# Article 2 — Designing Spot-Friendly Event Workers That Can Die at Any Time

**Type:** implementation / resilience article. **Role:** technical credibility.
The more distinctive of the two.

## Title

Preferred:

> **Making Spot Interruptions Boring: Designing Idempotent Event Workers on AWS**

Alternatives:

- Designing Event Workers That Can Die at Any Time
- How We Made SQS Workers Safe to Run on EC2 Spot
- Cheap Compute Without Fragile Systems: Building Interruption-Tolerant Workers
- Stateless Workers, Idempotent Writes, and Spot Instances

## Premise

> Spot instances are cheap because AWS can take them away. Instead of trying to
> prevent interruptions, design the application so losing a worker is boring.

The MongoDB atomic-operation / idempotency experience is the core.

## Thesis

> Spot reliability should not come from trying to keep individual machines
> alive. It should come from making individual machines irrelevant.

> The worker owns no durable state. The queue owns pending work. The datastore
> owns committed work. Losing the worker therefore only means some operation
> may need to run again.

Opening line (links back to Article 1):

> In my previous article I compared several ingestion architectures. One option
> was SQS feeding container workers running on Spot capacity. This article
> explains the reliability model behind that design.

## The failure model

Event `OrderCompleted`. Worker:

```text
1. receives event
2. reads customer state
3. updates attribution
4. updates aggregate
5. marks processing completed
```

Node disappears between 3 and 4. What happens? That's the article.

Key principle — don't build around "this function executes once"; build around
**"this operation may execute zero, one, or several times."**

## At-least-once delivery

```text
event → worker → worker crashes → visibility timeout expires
→ event visible again → another worker processes it
```

Great — *if* repeating is safe. Otherwise: double counters, duplicate orders,
double attribution, duplicate notifications, corrupted aggregates. Enter
idempotency.

## Idempotency (one of the deepest sections)

Bad:

```javascript
revenue += order.amount
```

$50 order → +50 → worker dies → retry → +50 → revenue is $100.

Better: track an event ID (`order_123_completed`) and do, **atomically**:

```text
if eventId wasn't processed: apply update, store eventId
else: no-op
```

If those steps aren't atomic, there is still a race.

## MongoDB — the technical centrepiece

Must use the real mechanism. Candidates: `$setOnInsert`, `$inc`,
`findOneAndUpdate`, unique indexes, upserts, conditional updates, transactions.

Illustrative only — do not publish unless it matches what was built:

```javascript
db.processedEvents.updateOne(
  { eventId },
  { $setOnInsert: { eventId, processedAt: new Date() } },
  { upsert: true }
)
// then mutate based on whether the insert happened
```

Better still — idempotency inside the business mutation itself:

```javascript
updateOne(
  { customerId, processedEvents: { $ne: eventId } },
  { $inc: { revenue: amount }, $push: { processedEvents: eventId } }
)
```

(Check unbounded-array scalability before publishing.) Lesson:

> **The closer idempotency is to the data mutation itself, the smaller the
> failure window.**

## Stateless workers — defined properly

Not "the process has no variables". It means: **nothing that must survive the
process is stored only inside the process.**

Safe in-process: cached connections, temporary objects, decoded event,
short-lived batch.

Unsafe as sole durable state: uncommitted aggregate, workflow progress,
identity graph, dedupe history, retry state.

Test:

> If deleting a worker manually causes data corruption, the worker owns too
> much state.

## The interruption, operationally

Spot node disappears → Kubernetes reschedules → visibility timeout returns
unfinished work → another consumer handles it → idempotent, so repeated event
is safe. Interruption becomes a **latency** issue, not a correctness issue.

Timeline (section 7):

```text
12:00:00 worker receives event
12:00:01 processing begins
12:00:02 node disappears
12:00:32 visibility timeout expires
12:00:33 another worker receives event
12:00:34 atomic operation identifies completed/partial work
12:00:35 processing safely finishes
```

## Responsibility decomposition (strong diagram candidate)

```text
Karpenter              capacity provisioning
SQS                    durable pending work
MongoDB                durable state
Idempotent processing  correctness
Kubernetes             scheduling
```

Karpenter is **not** the reliability layer.

```text
                 ┌───────────┐
 Producers ────→ │    SQS    │
                 └─────┬─────┘
             ┌─────────▼─────────┐
             │ Consumer pods     │
             │ Go · stateless    │
             └─────────┬─────────┘
             ┌─────────▼─────────┐
             │ MongoDB           │
             │ atomic mutations  │
             │ durable state     │
             └───────────────────┘

        Kubernetes → Karpenter → Spot capacity   "This may disappear."
```

## Graceful shutdown is an optimization

If the interruption notice / SIGTERM arrives: stop receiving, finish current
work, exit. But assume SIGTERM never arrives — process dies, machine vanishes,
network partition, kernel panic, OOM. **Graceful shutdown improves efficiency;
it must not be required for correctness.**

## Visibility timeout (own section)

SQS waits for the timeout before redelivering, so it sets recovery latency.
Too short → slow-but-legitimate processing causes duplicates. Too long → dead
worker delays retries. Variable durations → heartbeat via
`ChangeMessageVisibility`.

## Batch processing

Worker receives `A B C D E F G H I J`, crashes after E. Depending on
acknowledgement semantics you replay all ten or only `F–J`. This changes the
idempotency requirements.

## Poison events

receive → fail → retry → … forever. So `maxReceiveCount` → DLQ →
observability says something landed there.

## Observability

> Production systems should be debugged primarily through telemetry, not by
> attaching a debugger and hoping to reproduce production.

OpenTelemetry: logs, metrics, traces — connected, not three silos:

```text
ALERT consumer_error_rate > threshold
  ↓ structured error: eventId=abc customer=x operation=attribution-update
  ↓ traceId
  ↓ trace: SQS receive → Mongo read → Mongo write → error
```

Engineer understands the failure without recreating the environment.

## "Log once, enrich while propagating"

Bad — every layer logs the same error:

```go
func update() error  { ...; log.Error(...); return err }
func process() error { err := update(); log.Error(...); return err }
func handler()       { err := process(); log.Error(...) }
```

Better:

```go
func update() error {
    return fmt.Errorf("update attribution: %w", err)
}

func handler() {
    if err := process(...); err != nil {
        logger.Error("processing failed", ...)   // once, with trace correlation
    }
}
```

Rule:

> Return errors through the stack, enrich them with context, and log at the
> boundary where you can actually act on them.

## Metrics that matter — workload before machine

Ingestion first: queue depth, age of oldest message, events/sec, processing
latency, error rate, retry rate, DLQ depth, consumer count, database latency.
Then infrastructure: CPU, memory, node count, Spot interruptions.

## Why Go worked for this workload (personal, not universal)

Long-running process, concurrency, network I/O, simple deployment,
containerization, fast builds, low runtime overhead. Single binary, small
runtime surface, easy container packaging, good concurrency primitives,
straightforward error wrapping, strong OpenTelemetry ecosystem.

> Go turned out to be a particularly convenient fit for this workload.

Never "everyone should use Go".

**Build speed is reliability.** When production breaks, time-to-fix matters.
A 20-minute CI (install deps, compile native packages, transpile, bundle,
Docker layers) is operational friction. Compile → containerize → deploy in a
short cycle means faster recovery.

> Developer feedback loops are part of operational reliability.

## Outline

1. **Spot changes the failure assumption** — assume the machine *will*
   disappear.
2. **Build around durable boundaries** — SQS = pending work, MongoDB = durable
   state, worker = temporary compute.
3. **Stateless doesn't mean simplistic** — proper definition.
4. **At-least-once means duplicates are normal** — retry behaviour.
5. **Idempotency is the real reliability mechanism** — duplicate example.
6. **Atomic persistence** — the real MongoDB approach. Centrepiece.
7. **What happens during an interruption** — the timeline.
8. **Autoscaling with Kubernetes + Karpenter** — capacity separate from
   correctness.
9. **Graceful termination is an optimization** — SIGTERM without relying on it.
10. **Failure handling** — retries, DLQ, poison events, timeouts,
    backpressure.
11. **Observability from day one** — OTel, metrics, traces, structured logs.
12. **Log once, propagate context** — Go example.
13. **Why Go worked for this workload** — deployment ergonomics.
14. **What I'd do differently** — instrument earlier, automate DLQ inspection,
    better autoscaling metric, different visibility timeout, cost
    optimization, simpler Kubernetes resources — whatever is real. Big
    credibility boost.
15. **The general principle** — Spot was only one failure source; the same
    architecture made deployments, pod crashes, OOMs, node failures, and
    manual rescheduling less dangerous. This is an article about
    failure-tolerant workers; Spot just forces good architecture.

## Open questions to answer before drafting

**MongoDB (determines the whole technical example):** exactly how was
idempotency implemented? Did every event have an ID — client- or
server-generated? Where was the dedupe marker stored? Upsert / transactions /
unique indexes / conditional updates / `$setOnInsert` / `$inc`?

**Partial processing:** if one event meant several DB writes, could some
succeed before failure? How did you resume — independent operations, stored
progress, or was almost everything one atomic operation?

**SQS acknowledgement:** explicit delete after success? Visibility timeout
value? Extended? Batches?

**Karpenter:** what triggered scaling — CPU, pod scheduling, queue size via
custom metrics? Fixed replicas or autoscaled consumers? Did Karpenter mostly
provision after pod scale-out?

**Spot mix:** all Spot? On-demand baseline? Multiple instance families?

**Interruptions:** observed in production? What happened? Ever lose an event?
See duplicate execution? How often? One real incident makes the opening much
stronger.

## Not in this article (belongs to Article 1)

Lambda vs containers vs Kafka comparison, cost-shape analysis, "do you need
Kafka" argument, queue-vs-log distinction, the decision tree, the "is
Kubernetes overkill" discussion beyond Karpenter's capacity role, Go as a
general selection dimension.
