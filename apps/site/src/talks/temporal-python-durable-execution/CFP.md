# Call for proposals — drafts

## Python Zagreb meetup

### Title

Durable Python: from running custom SQS workers and Celery to Temporal

### Abstract

We've all built the same thing: a background process that needs to keep
going after the machine running it disappears. A fourteen-day trial that
sends a reminder, then some tips, then checks a subscription. The obvious
first version is a cron job plus a few timestamp columns on the users
table — and it works, right up until a worker crashes between "the email
provider accepted the message" and "we recorded that it was sent."

This talk starts from that ordinary failure and asks a deliberately naive
question: what would the code look like if the process could keep its place
across a restart? We build a tiny teaching replay runtime from scratch to
answer it, then show how Temporal's Python SDK implements the same idea for
real — workflows and activities, durable timers, signals, and saga-style
compensation for operations that need to be undone. Along the way we're
honest about the cost: replay compatibility constraints, the idempotency
work an activity still owes you, and the infrastructure you take on.

We close by pointing the same three questions — what must survive a
restart, which effects may repeat, who owns recovery — at AI agent
workflows, since "call a model, call a tool, wait for approval, do
something external" is the same durability problem with a different first
step.

### Format

~40 minute talk + 5 minutes Q&A.

### Audience and takeaways

Python developers who write background jobs, schedulers, or webhook
handlers — no prior Temporal experience assumed.

By the end, attendees can:

1. Explain what durable execution actually persists, and why.
2. Read a Temporal Python workflow (`@workflow.defn`, activities, durable
   waits, signals) and know which side of the workflow/activity boundary a
   piece of logic belongs on.
3. Name the exact boundary of what replay guarantees — and why an activity
   still needs its own idempotency strategy.
4. Decide, for a given background feature, whether cron, a queue, Temporal,
   or an event stream is the right fit.

### Speaker bio

Oleg — Exponential Ventures, a Silicon Valley startup accelerator. Works on
research and development across web applications, AI, robotics, and
full-stack systems for early-stage startups.
