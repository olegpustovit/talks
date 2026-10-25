# Durable Python: from running custom SQS workers and Celery to Temporal

React deck built on `@talks/slide-engine`, for Python Zagreb. 28 slides,
~41¼ minutes plus 5 minutes of Q&A.

Starting from an ordinary cron-based 14-day trial feature, the talk asks
what the code would look like if a process could survive a restart without
losing its place, builds a tiny replay runtime to answer it, shows where
replay stops (a crash between an activity's effect and its saved result),
and swaps in Temporal's Python SDK. Then come six case studies (checkout
saga, Stripe webhooks, then quick passes over an LLM document pipeline,
human review, tenant provisioning and a CRM sync), the catch (workflow code is a restricted subset of
Python), what happens when changed code replays an old history, what the
custom runtime buys you in tests, how the Temporal service runs, the Web UI
you get for free, and microservices: Kafka choreography next to workers
orchestrated by the Temporal Service (a distributed system that reads like a
monolith). It
closes on one question for the next background job you build: could this be
a workflow?

The AI-agents slide and the old better-prompt slide stay in `slides/` as a
cut list (see `App.tsx` and
`RESEARCH.md`).

Keep slides 10–13 together: original code and a question, the toy runtime
one function at a time, the transformed workflow with a looping crash
animation, then the Temporal import reveal. The rehearsal script and timing
table are in `RESEARCH.md`. For a shorter cut, use its omission list.

## Run

From the repo root:

```sh
bun install
bun run dev
```

Then open `/t/temporal-python-durable-execution` (or click it on the index).
The dev server binds to `0.0.0.0` by default, so it's reachable from another
device on the same network (a phone, a projector's browser) at your
machine's LAN address, not just `localhost`.

## Structure

Lives under `apps/site/src/talks/temporal-python-durable-execution/`:

- `App.tsx` — the deck: one `<Slide>` per slide, in order.
- `theme.ts` — per-talk theme overrides (Temporal's brand teal as the accent).
- `slides/` — one component per slide.
- `examples/` — the runnable Python behind the code on the slides.
- Registered in `apps/site/src/talks/registry.ts` for the site index.

## Controls

Arrows / Space / Page Up / Page Down / swipe reveal a slide's substeps (slide
11 reveals one function per press) before moving to the next or previous
slide. Home / End jump to the first / last slide, `F` toggles fullscreen, `N`
or `S` the speaker notes, `I` the slide list, `Shift+S` skips straight to the
next slide, and `#<n>` in the URL deep-links a slide. Slide 12's crash loops,
the case studies (14–19), the testing slide (22), the architecture slide
(23), the microservices diagrams (25, after one Next past its question) and
the choosing slide (26) animate on a loop by themselves; the code-change
slide (21) steps with the arrow keys.

## Images

`assets/web-ui-workflows.png` (slide 24) is a real screenshot of the
speaker's own Temporal Cloud namespace, not a stock image — see
`assets/ATTRIBUTION.md`. It shows a namespace name and org avatar in the
top bar; crop or blur before reusing this deck somewhere that isn't
acceptable to show.

## Code on the slides

The snippets are read from the Python files in `examples/`, so what's on a
slide is what runs.

The toy runtime has no dependencies. To check record/replay across a process
exit and timer recovery:

```sh
python3 examples/test_toy_runtime.py
```

Slide 21 (new code replaying an old history) has its own test, also with no
dependencies:

```sh
python3 examples/test_change_code.py
```

The Temporal code runs on Temporal's time-skipping test server: the case
studies' workflows in `cases.py`, and slide 13's trial with only its import
changed (slides 13–25):

```sh
pip install temporalio pytest pytest-asyncio
cd examples && pytest test_cases.py
```

`trial_effects.py` prints local effects and sends no email. The activities
in `cases.py` are stand-ins; the tests register fakes under the same names.
The slide 12 animations model the trial in the browser and run no Python.

The cut-list `AIAgents` slide's code is quoted and condensed from Temporal's own AI Cookbook,
not locally tested — it needs real agent-framework installs and API
credentials that aren't part of this deck. See `RESEARCH.md`'s code
assumptions for exactly which lines are verbatim.
