# Lambda in Ruby

> Two lambdas, zero Puma.

A **30-minute RubyConf** talk (same deck for **RubyZG** with extra Q&A) about the improbable path that put Rails on AWS Lambda — with sources, not generic serverless cheerleading.

## Open the deck

```sh
python3 -m http.server 8080
```

Open: `http://localhost:8080/meetups/rubyzg/lambda-in-ruby/`

Controls: arrows / Space · `F` fullscreen · `N` speaker notes · `?print` for print layout.

## Why this talk is not generic

Most “Ruby on Lambda” posts rehash hello-world handlers and a Lamby install line. This deck centers **verified oddities**:

| Discovery | Why it matters |
|-----------|----------------|
| **Two lambdas** | Ruby `Proc#lambda?` vs AWS Lambda — both strict about arity; handler uses `event:, context:` keywords |
| **Custom Ink arc** | 2014 microservices failure → 2017 ~90% image Lambda savings → whole Rails via Lamby |
| **“Several dozen lines”** | Ken Collins: Lamby is hash → Rack env, inspired by AWS's day-one Sinatra sample |
| **ALB over API Gateway** | They only needed HTTP proxying — fewer moving parts |
| **No mysql2** | Aurora Serverless adapter: ActiveRecord over HTTP Data API |
| **Jets Mega Mode** | Spawns a Rack subprocess in `/tmp` because Lambda disk is read-only |
| **YJIT after boot** | 37signals: disable at boot, `RubyVM::YJIT.enable` after Rails loads — critical on Lambda |

Full citations and minute-by-minute timing: [`RESEARCH.md`](./RESEARCH.md).

## 30-minute structure

| Block | Minutes | Topic |
|-------|---------|-------|
| Hook | 0–5 | Two lambdas + Custom Ink story |
| Rack path | 5–12 | Sinatra launch blog → Lamby → ALB |
| Weird adapters | 12–21 | Aurora HTTP SQL, Lambdakiq, Mega Mode fork |
| Performance | 21–27 | Post-boot YJIT, cold starts, 1792 MB |
| Close | 27–30 | Decision grid |

Rehearse to **28 minutes**; RubyConf sessions are 30 min with optional Q&A after.

## Materials

- [`study-guide.html`](./study-guide.html) — detailed visual guide to Lambda's
  Ruby runtime, event-to-Rack translation, Lamby versus Jets, databases, jobs,
  cold starts, YJIT, decision criteria, and presenter self-tests
- [`senior-exam.html`](./senior-exam.html) — 100-point candidate assessment
- [`senior-exam-answers.html`](./senior-exam-answers.html) — model answers and
  point-by-point grading rubric
- [`RESEARCH.md`](./RESEARCH.md) — speaker brief, sources, Q&A
- [`CFP.md`](./CFP.md) — RubyConf + RubyZG proposal text
- [`index.html`](./index.html) — slide deck (~17 slides ≈ 1.7 min/slide)

## Community

**RubyZG** — Zagreb Ruby meetup · https://www.meetup.com/rubyzg/

*If you're classy like Sinatra or hyped like Rails, we speak your language.*
