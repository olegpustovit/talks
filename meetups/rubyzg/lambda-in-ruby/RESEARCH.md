# Lambda in Ruby: talk research and speaker brief

## Chosen title

**Lambda in Ruby**

**Subtitle:** Two lambdas, zero Puma.

Ruby has **two** unrelated things called “lambda”: `Proc#lambda?` (strict arity, method-like `return`) and **AWS Lambda** (event-driven compute). The naming collision is not a bug — it is the talk’s hook. AWS handlers even use keyword arguments (`event:, context:`), which behave like Ruby lambdas, not loose procs.

## Abstract (RubyConf — 30 minutes)

Rubyists have lambdas in the language and Lambda in the cloud — and they mean completely different things until you notice both care about **arity and contracts**.

This talk follows the improbable path that put full Rails apps on AWS Lambda: Custom Ink’s 2014 microservices detour, a 90% cost win on image processing, Ken Collins’s “several dozen lines” Rack adapter (Lamby), and the weirder forks — Jets Mega Mode spawning a Rack subprocess inside `/tmp`, ActiveRecord talking to Aurora **without mysql2** via HTTP, and 37signals booting YJIT *after* Rails loads because cold start is a compile budget.

You will leave knowing how an HTTP event becomes a Rack env, why ALB beat API Gateway for a t-shirt monolith, when to extract plain Ruby handlers instead of booting Rails, and how to decide if serverless Ruby is engineering or adventure tourism.

## Audience and promise

Ruby developers who ship Rails. No AWS certification required.

By the end:

1. Name the **two lambdas** and why the handler’s keyword args matter.
2. Trace HTTP → RIC → Lamby → Action Dispatch in one diagram.
3. Explain **Aurora Serverless adapter** (SQL without a TCP socket in the Lambda).
4. Contrast **Lamby** (no Puma) vs **Jets Mega Mode** (Puma-like subprocess in `/tmp`).
5. Apply the **post-boot YJIT** trick and read X-Ray Init phase for cold starts.
6. Decide fit in 30 seconds using the decision grid.

## The thesis

Lambda is not “Rails, but cheaper.” It is **event-driven Rack hosting** with a 30-second HTTP ceiling — and the interesting Ruby story is how little code that took once someone stopped pretending Lambda was a tiny Sinatra script.

```text
AWS event (HTTP, SQS, S3, cron, …)
    ↓ Runtime Interface Client
Handler (plain Ruby or Lamby.cmd)
    ↓ optional hash rewrite
Rack env
    ↓
Rails / Sinatra / Hanami
    ↓
Lambda response
```

---

## Unusual discoveries (the non-generic spine)

Use these as “wait, what?” beats — each is sourced, not conference folklore.

### 1. Two lambdas, one language

- Ruby lambda: `Proc` with `lambda? == true`, strict arity, `return` exits the lambda not the enclosing method ([Ruby Proc docs](https://rubyapi.org/o/proc)).
- AWS Lambda: managed runtime invokes `lambda_handler(event:, context:)` — AWS docs explicitly recommend keyword args ([AWS Ruby handler](https://docs.aws.amazon.com/lambda/latest/dg/ruby-handler.html)).
- AppSignal’s explainer notes the naming collision explicitly — most blog posts skip it ([AppSignal](https://blog.appsignal.com/2023/06/21/an-introduction-to-lambdas-in-ruby.html)).

**Talk beat (2 min):** Show `proc { |x| x }` vs `->(x) { x }` arity error next to `lambda_handler(event:, context:)`. Same discipline, different scale.

### 2. Custom Ink: epic microservices failure → t-shirt Lambda win → whole Rails on Lambda

Ken Collins (AWS Serverless Hero, Custom Ink staff engineer):

- Custom Ink is among the **longest-running Rails production shops** (~20 years). They had frontend + backend Rails monoliths shielding legacy Java.
- **2014 microservices rewrite “failed miserably”** — business unit broke the monolith apart because it was fashionable; work rolled back ([Serverless Chats #32](https://www.serverlesschats.com/32/)).
- **2017**: engineer Hunter moved design-lab **ImageMagick off Rails into Node Lambda** — ~**90% cost savings**, featured on AWS Lambda customer stories. Pattern: pop performance-critical paths out, let success draw architecture lines.
- **Post Ruby runtime launch (Nov 2018)**: Ken asked “how can I get Rails into Lambda?” → **Lamby** — “technically a small rack adapter… converts ALB or API Gateway events into that Rack event… **all it knows is Rack messages**” (same podcast).
- Ken describes Lamby as **“several dozen lines of code”** inspired by AWS’s own Sinatra-on-Lambda sample ([Last Week in AWS #70](https://www.lastweekinaws.com/podcast/screaming-in-the-cloud/episode-70-creating-custom-t-shirts-through-the-cloud-with-ken-collins/)).

**Talk beat (3 min):** Failure before success. Serverless won on **bounded contexts** (images, catalog S3 IO), not big-bang microservices.

### 3. They chose ALB because API Gateway was overkill

Ken picked **Application Load Balancer** over API Gateway for early Lamby apps: “I knew I didn't need the features of API gateway. The only thing we used it for was basically proxying events.” ([Serverless Chats #32](https://www.serverlesschats.com/32/))

**Talk beat (1 min):** Counter-intuitive — less “serverless product” can mean simpler Rails hosting.

### 4. ActiveRecord without mysql2 — SQL over HTTP

Custom Ink’s **`activerecord-aurora-serverless-adapter`** replaces the MySQL socket with **`Aws::RDSDataService::Client`** — Aurora Serverless Data API over HTTP. Your `database.yml` uses `secret_arn` and `resource_arn`, not host/port ([gem README](https://github.com/customink/activerecord-aurora-serverless-adapter)).

Why it matters on Lambda: TCP connection pools to Aurora are painful in freeze/thaw execution environments; HTTP Data API is a different contract (latency tradeoff, simpler IAM).

Documented in [Migrate Rails from Heroku to Lambda](https://technology.customink.com/blog/2020/01/03/migrate-your-rails-app-from-heroku-to-aws-lambda/) (Custom Ink tech blog).

**Talk beat (3 min):** “Our Rails app doesn’t open a database socket.” — genuine weird flex.

### 5. AWS launched Ruby Lambda with Sinatra + Rack — Lamby’s blueprint existed on day one

The **Nov 29, 2018 AWS Compute Blog** announcement’s marquee example is migrating Sinatra via a thin `lambda.rb` calling Rack — not a hello-world script ([AWS blog](https://aws.amazon.com/blogs/compute/announcing-ruby-support-for-aws-lambda/)). Lamby industrialized that pattern for Rails.

### 6. Jets Mega Mode — a Rack server *inside* Lambda, living in `/tmp`

Ruby on Jets’ **Mega Mode** starts a **separate Rack subprocess** inside the Lambda execution environment and proxies to it. Because Lambda’s filesystem is read-only except **`/tmp`**, Rails boots from `/tmp` with up to 512 MB–10 GB writable space ([Jets Mega Mode docs](https://v5.docs.rubyonjets.com/docs/rails/megamode/)).

Cold start adds **~1–3 s** overhead after the parent Lambda cold start — “most pragmatic way to get Rails on serverless” per Jets docs.

**Contrast with Lamby:** Lamby eliminates the inner web server; Mega Mode **embeds** one. Know both exist — teams pick different weird.

### 7. Jets “poor man’s provisioned concurrency”

Jets enables **prewarming by default**: scheduled noop HTTP hits to controller Lambdas (`config.prewarm.rate`, default 1m). Docs call it a “smart or poor man’s version of Provisioned Concurrency” ([Jets prewarming](https://docs.rubyonjets.com/docs/config/prewarming/)).

Separate Lambda function fires cron — meta-serverless.

### 8. YJIT: compile after boot, not during boot

- Ruby 4.0 enables YJIT by default; Lambda docs recommend YJIT for Rails ([AWS Lambda Ruby](https://docs.aws.amazon.com/lambda/latest/dg/lambda-ruby.html)).
- Benchmarks: YJIT ON adds ~60 ms to cold start but cuts warm p50 (~11 ms → ~8 ms on small handler) ([Zenn Ruby 4.0 on Lambda](https://zenn.dev/geneg/articles/draft-2026-05-01-aws-lambda-adds-ruby)).
- **37signals / Basecamp**: `RUBYOPT=--yjit-disable --yjit-exec-mem-size=192` then **`RubyVM::YJIT.enable` after boot** — faster boot, ~18% faster requests ([37signals Dev](https://dev.37signals.com/yjit-is-fast/)).
- Ruby docs endorse lazy enable: “avoid compiling initialization code” ([YJIT md](https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html)).

**Lambda application:** in `config/environment.rb` or Lamby boot hook — enable YJIT after Rails finishes, not before.

### 9. Hanami on Lambda (2024) — not only Rails

`hanami-lambda` gem (2024): `Hanami::Lambda.call` as handler, SAM `Handler: config/app.Hanami::Lambda.call` ([github.com/elct9620/hanami-lambda](https://github.com/elct9620/hanami-lambda)). Small community, same Rack truth.

### 10. Ken Collins wrote the ActiveRecord SQL Server adapter

Before Lamby, Ken authored the **ActiveRecord SQL Server adapter** and represented Ruby to Microsoft during their open-source pivot ([Serverless Chats #32](https://www.serverlesschats.com/32/)). Pattern: replace the wire protocol, keep ActiveRecord.

---

## 30-minute run of show (RubyConf session)

**Hard limit: 30 minutes.** Optional Q&A is separate. Rehearse to ~28 min.

| Min | Slide / beat | Content |
|-----|----------------|---------|
| 0:00–2:00 | Two lambdas | Language vs cloud; keyword args; audience quiz |
| 2:00–5:00 | Custom Ink arc | 2014 failure, 2017 image Lambda 90%, “where’s Puma?” |
| 5:00–8:00 | AWS day-one Sinatra | Rack bridge; Lamby = industrialized sample |
| 8:00–12:00 | Lamby anatomy | RIC, Dockerfile, hash→env, ALB not API GW |
| 12:00–15:00 | Aurora without mysql2 | Data API adapter; Heroku migration story |
| 15:00–18:00 | Lambdakiq | SQS push not Sidekiq poll; shared image, different CMD |
| 18:00–21:00 | Fork: Mega Mode | Subprocess in /tmp; when inner Puma returns |
| 21:00–24:00 | YJIT after boot | 37signals trick; Ruby 4.0 defaults; measure Init |
| 24:00–27:00 | Cold start honesty | Numbers, prewarm vs provisioned, 1792 MB |
| 27:00–30:00 | Decision grid + 4 contracts | Use/skip; Event·Rack·Job·Contract |

**Cut ruthlessly if running long:** Jets prewarm (mention in speaker note only), Hanami (one line), Ken’s SQL Server past (one line).

### RubyZG meetup variant

Same deck; add 10 minutes of Q&A and optional live trace of Function URL JSON → Rack env. Do not add slides — go deeper on demo.

---

## Approaches reference (compressed)

| Approach | Weird factor | Rails fit |
|----------|--------------|-----------|
| Plain `lambda_handler` | No framework boot | Extract webhooks, images, cron |
| **Lamby** | AWS is Puma | Full Rack apps, container-first |
| **Lambdakiq** | SQS delivers jobs | ActiveJob adapter |
| **Aurora Serverless adapter** | SQL over HTTP | Lambda + Aurora without socket pools |
| **Jets / Mega Mode** | Rack child in `/tmp` | Legacy Rails, Jets ecosystem |
| **hanami-lambda** | Hanami-native handler | Light apps |

---

## Rails pitfalls (30-second version each)

1. Boot per **instance**, not request.
2. Pool size ≠ Puma threads — often `pool: 1`.
3. 30 s HTTP wall.
4. `/tmp` only — ActiveStorage → S3.
5. Action Cable / WebSockets → elsewhere.
6. Migrations in CI, not on boot.

---

## Demo plan (30 min friendly)

**Primary (no AWS account):** One Function URL event JSON on screen → highlight keys that become `rack.input`, `REQUEST_METHOD`, `HTTP_*`.

**Secondary (30 s video clip):** CloudWatch log showing Init duration vs invoke duration.

**Skip live deploy** in 30 min slot — too brittle.

---

## Primary sources

- [Serverless Chats #32 — Ken Collins](https://www.serverlesschats.com/32/)
- [Last Week in AWS #70 — Ken Collins](https://www.lastweekinaws.com/podcast/screaming-in-the-cloud/episode-70-creating-custom-t-shirts-through-the-cloud-with-ken-collins/)
- [Custom Ink — Rails on Lambda with SAM (2019)](https://technology.customink.com/blog/2019/03/13/rails-on-aws-lambda-with-sam/)
- [Custom Ink — Heroku to Lambda + Aurora adapter](https://technology.customink.com/blog/2020/01/03/migrate-your-rails-app-from-heroku-to-aws-lambda/)
- [AWS — Announcing Ruby on Lambda (Sinatra sample)](https://aws.amazon.com/blogs/compute/announcing-ruby-support-for-aws-lambda/)
- [Lamby docs](https://lamby.cloud/docs/anatomy)
- [Lambdakiq](https://github.com/rails-lambda/lambdakiq)
- [activerecord-aurora-serverless-adapter](https://github.com/customink/activerecord-aurora-serverless-adapter)
- [Jets Mega Mode](https://v5.docs.rubyonjets.com/docs/rails/megamode/)
- [Jets Prewarming](https://docs.rubyonjets.com/docs/config/prewarming/)
- [37signals — YJIT after boot](https://dev.37signals.com/yjit-is-fast/)
- [Ruby YJIT lazy enable](https://docs.ruby-lang.org/en/3.4/yjit/yjit_md.html)
- [hanami-lambda](https://github.com/elct9620/hanami-lambda)
- [Ruby 4.0 on Lambda](https://aws.amazon.com/about-aws/whats-new/2026/04/aws-lambda-adds-ruby/)

## Likely Q&A (short answers)

- **vs Fargate/Kamal?** Steady load → server; spikes → Lambda.
- **Lamby vs Jets?** Lamby = one container, one Rack app; Jets = framework generating many functions + optional Mega subprocess.
- **Aurora Data API latency?** Real tradeoff; wins on connection management in Lambda.
- **Is Mega Mode insane?** Pragmatic for migration; Lamby cleaner long-term.

## Speaker prep

- [ ] Rehearse with timer — 28 min target
- [ ] Memorize Custom Ink 2014 → 2017 → Lamby arc (60 s)
- [ ] One slide with real Function URL JSON (redact account IDs)
- [ ] Decide if you say “lambda” aloud or “λ proc” vs “AWS Lambda” consistently
