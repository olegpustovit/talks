# Call for proposals — drafts

Replace bracketed placeholders before submitting.

---

## RubyConf (30-minute session)

### Title

Lambda in Ruby

### Abstract

Ruby has two unrelated things called "lambda": strict `Proc`s in the language and AWS Lambda in the cloud. Both care about arity and contracts — and that collision is the front door to a stranger story than most serverless talks tell.

Custom Ink — one of the longest-running Rails shops — watched a 2014 microservices rewrite fail, then saved ~90% on design-lab image processing with Lambda, then asked a heretical question: can the whole Rails app go serverless? Ken Collins's answer was Lamby, a Rack adapter Ken describes as "several dozen lines of code" that turns API Gateway or ALB events into Rack env hashes so AWS becomes the web server and Puma stays out of the container.

This 30-minute session follows that arc and the weirder branches: ActiveRecord without mysql2 via Aurora's HTTP Data API, Jets Mega Mode booting a Rack subprocess inside `/tmp` because Lambda's disk is read-only, Lambdakiq replacing Sidekiq polling with SQS push, and 37signals enabling YJIT *after* Rails boot because cold start is a compile budget.

You will leave able to trace HTTP → Rack → Rails on Lambda, name when ALB beats API Gateway, and decide honestly whether serverless Ruby fits your app or whether Kamal and a VPS remain the sane choice.

### Duration

30 minutes (session talk)

### Speaker bio (100 words max)

`[Your name]` — `[role]`. `[Why you care about this intersection — e.g. RubyZG organizer, shipped Lambda glue from a Rails monolith, etc.]`

---

## RubyZG meetup (same deck + longer Q&A)

Use the RubyConf abstract above for the event description. Schedule **40–45 minutes** with the speaker (30 min talk + Q&A). Link: https://www.meetup.com/rubyzg/

### Meetup one-liner

Two lambdas, zero Puma — how a t-shirt company put Rails on AWS Lambda (and the weird adapters along the way).
