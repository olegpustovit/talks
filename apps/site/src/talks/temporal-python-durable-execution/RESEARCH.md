# Durable Python: from running custom SQS workers and Celery to Temporal — talk research and speaker brief

## Chosen title

**Durable Python: from running custom SQS workers and Celery to Temporal**

Speaker: Oleg — Exponential Ventures. Event: Python Zagreb.

## Thesis

A piece of business logic that needs to keep going after the process running
it disappears is a very ordinary problem, and most of us solve it by hand
every time — cron flags, retry columns, "has this already been sent"
booleans — without naming the problem itself. Durable execution names it:
persist the information needed to reconstruct progress, so a replacement
worker can continue the same logical work. Temporal is one implementation
of that idea for Python; the talk teaches the model first (with a tiny
teaching replay runtime), then the SDK, so the audience can judge Temporal's
actual tradeoffs — replay compatibility, activity idempotency, operational
cost — against a concrete requirement instead of taking the pitch on faith.

The same crash animation then shows where replay stops: kill the worker
between an activity's effect and its saved result, and the effect runs twice
— the crash between two writes from slide 4, moved into the activity. Six
case studies show the same workflow shape: a checkout saga and a
deduplicated webhook in detail, then an LLM document pipeline, human review,
tenant provisioning and a CRM sync in about 45 seconds each. The talk names
the cost (workflow code is a restricted subset of Python; changed code
replays old histories, shown with the toy runtime sending the wrong emails
and then failing loudly; a service with two databases has to run somewhere)
and the payoff (tests that own time).

The closing move: it isn't about Temporal. Look for the simpler shape.
Before building another homegrown workflow engine out of status columns and
sweepers, sketch the process as a workflow — what must survive a restart,
which effects may repeat, who owns recovery — even if you then build it with
cron.

## Format and timing

~41¼ minutes plus 5 minutes of Q&A, 28 slides — about 3¼ minutes over a
38-minute slot. Case studies 16–19 are planned as quick passes; use the ~30
minute cut below if you run long. The table and speaker-note headers follow
the order in `App.tsx`, and the phone remote reads each slide's planned
window from its header, so keep them in sync when reordering.

| Time | Slide |
|------|-------|
| 00:00–01:30 | 01 Durable Python |
| 01:30–02:45 | 02 A 14 day trial |
| 02:45–04:00 | 03 A table, a worker, a clock |
| 04:00–05:15 | 04 reminder_sent_at |
| 05:15–06:30 | 05 Why so complicated? |
| 06:30–08:00 | 06 An infinitely reliable computer |
| 08:00–10:00 | 07 Durable execution |
| 10:00–11:00 | 08 Where it came from |
| 11:00–12:15 | 09 Replay the workflow from saved results |
| 12:15–13:00 | 10 How do we apply workflows to this code? |
| 13:00–16:00 | 11 Let's build a runtime that remembers |
| 16:00–19:30 | 12 The same trial can survive a worker |
| 19:30–20:15 | 13 Now change the imports |
| 20:15–21:45 | 14 A failed shipment refunds the card |
| 21:45–23:00 | 15 A retried webhook can't run twice |
| 23:00–23:45 | 16 A rate limit on page 7 retries page 7 |
| 23:45–24:30 | 17 A workflow can wait two days for a person |
| 24:30–25:15 | 18 A certificate wait survives a dead worker |
| 25:15–26:00 | 19 A deploy mid-sync resumes at page 43 |
| 26:00–28:30 | 20 Workflow code only looks like Python |
| 28:30–31:30 | 21 New code replays an old history |
| 31:30–32:45 | 22 A 14-day trial test runs in a third of a second |
| 32:45–35:15 | 23 One endpoint, four services, two databases |
| 35:15–36:15 | 24 The dashboard ships with the service |
| 36:15–38:00 | 25 A distributed system that reads like a monolith |
| 38:00–39:15 | 26 Choosing the right execution model |
| 39:15–40:15 | 27 Could this be a workflow? |
| 40:15–41:15 | 28 Outlive the machine |
| 41:15–46:15 | Q&A on slide 28 |

### Cut list

These slide files stay in `slides/` but are not in `App.tsx`. Use them for
Q&A or a longer slot; each still has its rehearsal notes.

- `AIAgents` — an agent's approval is a durable wait
- `BetterPrompt` — its three questions are now spoken on slide 27

### Slides 10–13 rehearsal script

**10. Ask the question.** Show the original 2 + 8 + 4 day imperative code.
"How do we apply workflows to a piece of code like this?" Pause. Leave the
answer for the next slide.

**11. Build the answer.** Each arrow reveals one function of the runnable
`examples/toy_runtime.py`: `__init__` (history and cursor), `save`,
`execute_activity`, `sleep`, then the decorators and public names. The
bar is intern-readable: `execute_activity` and `sleep` share one shape —
saved at this position? use it; otherwise do it and save it; move the
cursor. Imports stay in the source file.

**12. Apply it, then kill it.** Show the infinite-machine code, then the
workflow beside it. The workflow is six sequential statements that mirror
the `time.sleep` version line for line — no loop, because the mirror is the
point. Next plays a looping animation with no controls: the reminder is
sent and saved, the worker dies waiting for day ten, a new worker replays
the reminder from history (counter stays one) and sends tips. Next once
more: a second loop where the worker dies after `send_reminder` runs but
before its result is saved; the replacement sends it again (counter two).
Tie it back to slide 4: the crash between two writes moved into the
activity. The simulation sends no real emails.

**13. Reveal the imports.** No visible title. Show the whole workflow with
the toy import, then change `from toy_runtime import activity, workflow` to
`from temporalio import activity, workflow`. "Look at that. This is valid
Temporal Python." The toy API was chosen to match the SDK. It is not the
implementation of Temporal. Transition: "So what can you build with this?"

### Slides 14–19 rehearsal script

Six case studies. Each slide plays its own loop: code on the left with the
running lines highlighted, the product on the right. Don't wait for the
loop; talk over it. Beats: the usual hand-built version, the workflow, the
honest cost. Take 14 and 15 properly; 16–19 are quick passes, about 45
seconds each.

- **14 Saga.** Compensation is ordinary code with durable state. Undo
  registered *before* each step; `except ActivityError` walks it backwards;
  then `raise`.
- **15 Stripe webhook.** The workflow ID is the dedupe table. Workflow ID =
  event ID, `REJECT_DUPLICATE`, `WorkflowAlreadyStartedError` → still 200.
  "Four more, quickly."
- **16 LLM documents.** One activity per page, `asyncio.gather` ten at a
  time, a 429 retries one page.
- **17 KYC review.** `wait_condition` with a 48-hour timeout, escalate,
  an update carries the decision.
- **18 Tenant provisioning.** A heartbeating poll activity; a dead worker
  is detected by heartbeat timeout and the activity retries elsewhere.
- **19 CRM sync.** Cursor as a local variable, a deploy resumes at page 43,
  continue-as-new after 200 pages. End with: "So what's the catch?"

### Slides 20–28 rehearsal script

**20. The catch.** Question alone, then six rules at about twenty seconds
each. End: the complexity moved into rules, and rule one has a consequence
the first time you deploy.

**21. New code replays an old history.** Arrow keys, nine beats. Ada on day
11, deploy a day-7 nudge, replay on the unchecked toy: the nudge gets
`send_tips`'s saved result, tips send twice, the trial ends on day 18. Then
the four-line `CheckedWorkflow` stops at position 3 before any email. Last
beat: Temporal's check, `workflow.patched`, and the Replayer in CI.

**22. Tests that own time.** Loops by itself. The real Trial from slide 13
on the time-skipping server; the measured 0.32 s is the whole pytest run.

**23. Architecture.** Loops by itself, about 4½ seconds a beat: six steps
of one workflow start, then self-hosted vs. Temporal Cloud. Take the full two and a half minutes.

**24. Observability.** No exporter to wire up — the Visibility store from
the architecture slide, with a page on it. Transition: "So what about
microservices?"

**25. Microservices.** The question alone, full screen. Press Next once;
the diagrams then loop by themselves, about 4½ seconds a beat. Left: four services
choreographing over Kafka. Right: the same four teams, each running a worker
that polls its own task queue on the Temporal Service; the checkout worker
runs the workflow. Beats: one `charge_payment` task on the `payments` queue;
payments mid-deploy, the task waits; "still a distributed system, but the
process reads like a monolith"; the cost (a central service, activity
signatures as a cross-team API).

**26. Choosing.** Rows highlight one at a time on a loop. A heuristic, not a
ranking.

**27. Could this be a workflow?** The point of the talk. Not Temporal: a
simpler shape to have in your toolset before building a homegrown workflow
engine. The three questions are spoken, not on the slide.

**28. Outlive the machine.** Title-slide layout and log, the process
finishing. One line, thank you. Stays up for Q&A.

### ~30 minute cut

Keep slides 10–13 as the proof of the idea, including both loops on 12.
Keep 14 and 15, but skip the loop on 14 and say its one line. Name 16–19 in
one sentence and skip them. Keep 20 at ten seconds per rule and 21 in full;
it is the honest-cost beat. On 23, talk only over the last two beats (who
runs what). Skip 24. On 25, say only the question and the monolith line; let the
loop carry the rest. Skip 26. Rehearse the reduced sequence; this is a
presenting cut, not a separate build.

## Sources checked

Checked 15 September 2026 unless noted:

- [Temporal Python SDK, workflow and activity definitions](https://github.com/temporalio/sdk-python#implementing-a-workflow): slide 13 imports, decorators, activity timeout, and worker registration.
- Slide 25's diagram is simplified: one task queue per team, workers polling
  the service. `workflow.execute_activity(..., task_queue="payments")` is a
  real parameter (checked against temporalio 1.x installed via uv, 15
  September 2026); the tested `Fulfillment` workflow does not set it, so all
  activities share one queue in the tests. The cost beat (service as a
  shared dependency, activity signatures as an API) is the speaker's
  judgment, not a sourced claim.
- Q&A background for slide 25's choreography side (the line-by-line code
  slide was cut), taken from the speaker's own Durable Python course notes
  and their source list; the quotes were not re-checked against the
  originals in this pass — recheck before the talk:
  [Martin Fowler, What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html)
  (the flow "is not explicit in any program text");
  [Netflix Conductor](https://netflixtechblog.com/netflix-conductor-a-microservices-orchestrator-2e8d4771bf40)
  ("almost no way to systematically answer" what remains in a process);
  [Michelin, choreography or orchestration](https://blogit.michelin.io/choregraphy-or-orchestration-thats-the-question/)
  and [Part 3](https://blogit.michelin.io/moving-from-orchestration-to-choreography-part-3/)
  (17 processes moved off a BPM orchestrator to Kafka events; error handling
  and monitoring built afterwards);
  [AWS saga choreography](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html).
  `Fulfillment` in `examples/cases.py` is the workflow slide 25's checkout
  worker runs; two tests in `examples/test_cases.py` check it on the
  time-skipping server (no warehouse signal: refund then release after three
  days; signal: "shipped", no compensation).
- Not re-checked in this pass — recheck before the talk: `workflow.patched`
  (Python SDK versioning) and `temporalio.worker.Replayer` for slide 21's last
  beat. The patched fragment on that slide is not run by any test.
- [Python SDK guide](https://docs.temporal.io/develop/python): slides 14–19 — activities, retries, updates, wait conditions, heartbeats, continue-as-new, schedules.
- Temporal Python SDK source (`temporalio` 1.33.0): `WorkflowIDReusePolicy.REJECT_DUPLICATE` and `start_workflow` raising `WorkflowAlreadyStartedError` (slide 15; the default policy is `ALLOW_DUPLICATE`); `wait_condition(timeout=...)` raising `asyncio.TimeoutError` (slide 17); `WorkflowEnvironment.start_time_skipping` and `get_current_time` (slide 22).
- [Stripe webhooks](https://docs.stripe.com/webhooks): slide 15 — endpoints can receive the same event more than once, and undelivered events are retried.
- [Python SDK sandbox restrictions](https://github.com/temporalio/sdk-python/blob/main/temporalio/worker/workflow_sandbox/_restrictions.py) and [workflow instance event loop](https://github.com/temporalio/sdk-python/blob/main/temporalio/worker/_workflow_instance.py): slide 20 — `time.sleep`, `datetime.now`, `uuid4` and module-level `random` restricted at runtime (`RestrictedWorkflowAccessError`); the workflow instance is its own `asyncio.AbstractEventLoop`; `asyncio.sleep` goes through its `call_later` timer.
- [Self-hosted limits](https://docs.temporal.io/self-hosted-guide/defaults): slide 20 — payload errors at 2 MB; history errors at 50 MB or 51,200 events and the execution is terminated.
- [Temporal Server services](https://docs.temporal.io/temporal-service/temporal-server): slide 23 — Frontend, History, Matching and Worker services; gRPC ports 7233–7235; the history shard count cannot be changed after the cluster is created.
- [Persistence](https://docs.temporal.io/temporal-service/persistence): slide 23 — Cassandra 3.11, 4.0 and 5.0.4+, PostgreSQL 13–16, MySQL 5.7 and 8.0; SQLite for development and testing only.
- [Visibility](https://docs.temporal.io/self-hosted-guide/visibility): slide 23 — Elasticsearch 7 and 8, OpenSearch 2+, MySQL 8.0.17+, PostgreSQL 12+.
- [Temporal Helm chart values](https://github.com/temporalio/helm-charts/blob/main/charts/temporal/values.yaml): slide 23 — default `numHistoryShards`.
- [Temporal Cloud pricing](https://temporal.io/pricing): slide 23 — $50 per million actions at the base rate, active and retained storage billed separately. Prices change; recheck before the talk.
- [Web UI](https://docs.temporal.io/web-ui): slide 24 — ships with every Temporal CLI release and is available on Temporal Cloud, same interface both places; the Workflows page lists executions within the retention period, filterable by status, workflow ID, workflow type, and search attributes.
- [Human-in-the-loop AI agent, AI Cookbook](https://docs.temporal.io/ai-cookbook/human-in-the-loop-python): cut-list `AIAgents` — the `approval_decision` signal, the `pending_request_id` match, and `wait_condition(..., timeout=...)` are quoted from this page; checked 15 September 2026.
- Temporal Python SDK source, `temporalio/contrib/` (checked 15 September 2026 against the `main` branch — contrib packages move fast, recheck before the talk): cut-list `AIAgents` — `openai_agents` (`OpenAIAgentsPlugin`, tool calls and handoffs as activities), `langgraph` (`LangGraphPlugin`, runs `StateGraph` nodes and `@entrypoint`/`@task` functions as activities; its README says explicitly "this plugin runs LangGraph nodes and tasks as Temporal Activities" and is marked experimental), `google_adk_agents`, `strands`.
- Greg Haskins (Manetu co-founder/CTO), ["The thread is the Workflow: Durable AI agents without changing Agent code"](https://temporal.io/blog/manetu-the-thread-is-the-workflow), temporal.io/blog, 3 September 2026: cut-list `AIAgents` — "Human-in-the-loop resume and crash-recovery resume look identical from outside... but they aren't the same operation" and "durability becomes a property of how the agent is run, not how it is written." A guest/community post, not a Temporal engineering claim, but it's the sourced basis for the checkpointer-vs-durable-execution line on the slide.
- [temporal.io/solutions/ai](https://temporal.io/solutions/ai): checked 15 September 2026 — Temporal's own AI marketing page makes no explicit LangGraph/CrewAI/AutoGen comparison, so the slide's comparison is sourced to the Manetu post above, not to Temporal's own claims.
- Garcia-Molina and Salem, "Sagas", SIGMOD 1987: slide 14.
- [Python examples](https://github.com/temporalio/samples-python): reference applications.
- Historical sources checked 14 September 2026: temporal.io/about,
  temporal.io/blog/samars-journey, Cadence / Uber origins, slide 8.

## Code assumptions

- `examples/toy_runtime.py` is runnable Python. Slide 11 reads its snippets
  directly. One workflow, one worker, one JSON-lines file; replacement must
  use the same file and start with cursor zero. It assumes intact JSON lines
  and does not handle concurrent writers, torn writes, or automatic retries.
  Timers persist a deadline before waiting. Replay does not check that the
  code makes the same calls in the same order, and the activity timeout
  option is accepted and ignored — both left out so the mechanism stays
  readable.
- `examples/trial.py` is the complete application behind slides 12–13.
  `trial_effects.py` contains local stand-ins for the existing business I/O.
  The workflow is six sequential statements with the original relative
  delays of 2, 8, and 4 days. Activities are async and every call passes a
  one-minute `start_to_close_timeout`, which Temporal requires.
- Replacing only the toy import with the Temporal import produces valid
  SDK definitions: `examples/test_cases.py` writes exactly that file and runs
  Trial on the time-skipping server with fake activities.
- Slide 12 is a browser simulation of that sequence that loops by itself.
  The first loop kills the worker after the reminder is saved; the
  replacement replays it without another effect. The second loop kills it
  after the reminder runs but before its result is saved; the replacement
  runs it again (`send_reminder ×2`). Both use the `ExecutionReplay` model in
  `packages/slide-engine`; no Python runs.
- Slide 21 reads `examples/trial_v2.py` (trial.py plus a day-7 `send_nudge`)
  and the `CheckedWorkflow` snippet from `examples/toy_runtime.py`.
  `examples/test_change_code.py` replays a hand-written day-11 history from
  trial.py on the new code and checks every number on the panel: unchecked,
  the nudge is never sent, `send_tips` runs again, and the expiry deadline is
  day 18; checked, it raises `NondeterminismError` at position 3 with no
  email and the history unchanged. The panel is an illustration of that run,
  not a live process. The `workflow.patched` fragment on the last beat is
  Temporal code that no test runs.
- Slides 14 and 16–19 read their code from `examples/cases.py`. Its
  activities are stand-ins; `examples/test_cases.py` registers fakes under the
  same names and checks each claim on Temporal's time-skipping server
  (temporalio 1.33.0, Python 3.12): compensations run in reverse after a
  failed shipment; only the rate-limited page retries; the review escalates
  after 48 hours and accepts an update (the time-skipping server supports
  updates); provisioning runs the real certificate activity; the sync
  continues as new after 200 pages and carries the cursor.
- Slide 24's screenshot is the speaker's own Temporal Cloud namespace
  (`assets/web-ui-workflows.png`, retrieved 2026-09-15), not a stock image or
  demo account — see `assets/ATTRIBUTION.md`. The namespace name and org
  avatar are visible in the top bar; crop or blur before using this deck
  outside a context where that's acceptable to show.
- Cut-list `AIAgents`' code is condensed from the AI Cookbook's human-in-the-loop
  example, not locally tested — it isn't runnable as shown (`ApprovalDecision`,
  `AgentRequest`, and `take_action` aren't defined) and, unlike the case studies,
  there's no `pytest` file backing it: doing so would need real OpenAI Agents
  SDK / LangGraph installs and API credentials. The `signal` handler, the
  `pending_request_id` match, and the `wait_condition(..., timeout=...)` call
  are quoted from the cookbook page; say on stage that this one is quoted
  from the docs, not run.
- Slide 15's handler is a fragment (`app`, `verify_signature` and the
  `temporal` client are not defined). The test file checks the part that
  matters: with `REJECT_DUPLICATE`, starting the same ID again raises
  `WorkflowAlreadyStartedError` after the first run finishes, and the default
  policy runs it again.
- The case-study visuals are illustrations. Their numbers (38 ms, 40
  minutes, 24,900 contacts, order #1042) are scenario values, not
  measurements.
- Slide 20 shows the slide-13 workflow and six rules with short fragments,
  not runnable programs. Each "breaks" fragment names a real SDK behavior.
- Slide 22's 0.32 s is a measured, warm pytest run of that one test on the
  speaker's laptop (15 September 2026). The first run downloads the test
  server and took about 3 s.
- Slide 23 is a simplified architecture: it omits Ringpop membership,
  task queue partitions, sticky queues and replication.
- Slides 7–8 trace ideas and people, not a claim that Azure forked SWF.
  The named code fork is Cadence to Temporal.

## Q&A prep

- **vs. a queue/cron?** Temporal earns its keep when a process has
  meaningful state across steps, waits a long time, reacts to external
  events, or needs explicit compensation. A queue is enough when each task
  stands alone; cron is fine when recovery is easy to explain.
- **Does replay guarantee exactly-once?** No — only for activity completions
  already in the history. An effect whose completion never reached Temporal
  can still be retried; that's an idempotency problem the activity contract
  has to solve, not something replay solves for you.
- **Self-host or Cloud?** If nobody on the team is already on call for a
  stateful distributed database, start on Cloud. Self-hosting means four
  services, two databases, and a shard count chosen once.
- **Is the time-skipping server the real thing?** No, it's a test server.
  It runs the real workflow code and timers; integration tests still belong
  on a real service.
- **What about a high-volume event stream?** Kafka (or similar) usually fits
  that processing model better — Temporal doesn't need to carry every event
  just because some business processes use it.
- **Does this make AI agent tool calls safe to retry?** Durability doesn't
  make a model's answer correct or guarantee a request is never billed
  twice — it gives you a place to reason about the process around the
  model (retries, cost policy, durable waits for approval).
- **Suggested first experiment for the audience:** compress the 14-day trial
  into seconds, stop a worker while a timer is pending, restart it, and
  inspect what the workflow remembers. Then try the harder case — an
  activity that succeeds externally but loses its response.

## Speaker prep

- [ ] Rehearse with a timer against the table above; the 30-minute cut is a
      live decision, not a separate deck.
- [ ] Have the trial's timeline (day 0/2/10/14) memorized cold — it's the
      through-line for the entire talk.
- [ ] Recheck Temporal Cloud pricing the week of the talk.
- [ ] Run `pytest examples/test_cases.py` once on the presenting laptop so
      the test server is already downloaded.
- [ ] Run `python3 examples/test_change_code.py` after any edit to
      `toy_runtime.py`, `trial.py` or `trial_v2.py`; slide 21's numbers depend
      on it.
- [ ] Leave the closing slide (28) up for the full 5-minute Q&A window.
