# AWS Community Builder articles

Two related but non-overlapping articles drawn from operating an event-tracking
ingestion system for multiple e-commerce brands.

- [`ingestion-architecture-unknown-scale/`](./ingestion-architecture-unknown-scale/) —
  **decision article**: which ingestion architecture to choose when traffic,
  budget, and future scale are unknown. Wider reach.
- [`spot-friendly-event-workers/`](./spot-friendly-event-workers/) —
  **implementation article**: how to design SQS workers so Spot interruptions
  (and every other way a worker can die) don't matter. Technical credibility.

Article 1 asks *which architecture?*; Article 2 asks *how do I make one of them
reliable?*. Each `BRIEF.md` lists what belongs to the other article so the two
don't blur together.

## Writing method

Do not prompt "write me an article about X". Per section: the author talks for
3–5 minutes answering the open questions in the brief, the answers are
captured, then compressed into prose. The author's reasoning, vocabulary, and
tradeoffs stay; AI only edits and compresses.

Article 1 has roughly 50–60% of its material already. Article 2 still needs the
MongoDB idempotency details before its centrepiece can be written.
