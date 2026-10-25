# Running Ruby apps on AWS Lambda

Thesis: Keep a small HTTP application's Ruby and Rack boundary while choosing an execution environment deliberately. Startup, durable work and data access determine whether Lambda fits; native compilation is a separate experiment.

Audience: RubyZG developers familiar with web applications, not necessarily Lambda or Rack internals.

Event: RubyZG, 22 October 2026. Presenter: Oleg Pustovit.

## Source and fidelity

Ported from https://artifacts.microapps.space/a/bx9sv102cxmx, version 8, index.html SHA-256 `1eb5132925b48e09d6a2a737490e529a77c6485c1e6c85928bb48baff9c25130`.
The kept original slides retain their titles, subtitles, editable SVG diagrams, three reveal cues, full speaker paragraphs and source links (slide 1 now uses an ambient `ThreadField` animation; slide 4 is four looping example scenes under `slides/companions/`). Slides 2–3 (`NeedsAComputer`, `FreeComputers`) set up the problem and the free-tier offer, and slides 5–7 (`RailsOnLambda`, `ColdStartSlide`, `EveryCopySlide`) replace the original slides on HTTP behavior, intermittent work, what Lambda runs, Rails behind Lamby and the pre-handler work; slides 8–12 (`BackToBasics`, `RackContract`, `EventToEnvSlide`, `Mapper`, `HandlerApp`) replace the original Rack-boundary section with real code, drawn from `slides/companions/code.ts`; slide 13 (`UnderTheHood`) opens one copy up: the bootstrap loop, managed vs image vs custom runtime, native gems, and a hand-written runtime against the Runtime API. Precise numbers sit in starred footnotes, not headlines; the cold-start split on slide 6 is illustrative until measured. Scroll-driven scenes become slide-engine keyboard and remote steps. Motion respects reduced-motion settings. No iframe or artifact service is required at runtime.

## Rehearsal timing

Proposed pacing, not a measured rehearsal:

| Slides | Argument | Minutes |
| --- | --- | --- |
| 1 | Title | 0.5 |
| 2 | Who I am: early-stage startups, Exponential Ventures, AWS Community Builder | 0.5 |
| 3–4 | Every app needs a computer; Lambda gives you tiny ones for free | 2 |
| 4 | Where Lambda gets used: four Ruby examples | 3 |
| 5–7 | Rails on Lambda is tempting; the cold start and every new copy pay for all of Rails | 5 |
| 8–12 | Back to basics: the handler, Rack, the event-to-env mapper, Sinatra behind it | 9 |
| 13 | Under the hood: the runtime loop, who owns each layer, native gems, a custom runtime | 4 |
| 14 | The ecosystem: Lamby, a small Rack framework, DynamoDB or SQL behind a proxy, SQS jobs, CloudFront | 4 |
| 15 | Deploying: CDK on CloudFormation vs a Terraform plan | 3 |
| 16 | Deploying in 2026: an agent running the AWS CLI from a skill | 2 |
| 17 | Know when to use it: bursty vs steady traffic, and the gotchas on the terrain | 3 |
| 18 | Bonus: divider | 0 |
| 19 | Bonus: a Lambda on your tailnet (Tailscale), reaching home | 3 |
| 20 | Bonus: Ruby compiled ahead of time with Spinel, live on Lambda | 3 |
| 21 | Bonus: an MCP server in Ruby that runs your house | 3 |
| 22 | Choose the next small API | 1 |

## Code and evidence assumptions

The code in the diagrams is teaching material, not a complete adapter. HTTP examples target payload v2; real headers, cookies, binary bodies and lifecycle cleanup require a maintained integration. No AWS resources are provisioned by this deck.
The Rails cold-start figures on slides 6 and 12 are illustrative. The Spinel numbers on slide 20 are measured: `demo/spinel-lambda` (Spinel commit 0e7b469d, arm64, 1769 MB, eu-central-1) reported Init Duration 13.8–17.7 ms over 4 cold starts and Duration 4.1–8.5 ms over 16 warm requests, 21–29 MB used, on 22 October 2026. Re-run `make cold` and `make logs` before the talk and update the slide if they move. Tailscale publishes no Lambda cold-start numbers; measure before quoting.

## Sources retained from the artifact

- [How Lamby works](https://lamby.cloud/docs/anatomy)
- [Function URL event and response format](https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html)
- [Lambda concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Lambda execution environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
- [Custom runtime contract](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html)
- [Rack specification](https://github.com/rack/rack/blob/main/SPEC.rdoc)
- [Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [Lambda VPC internet access](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html)
- [S3 and DynamoDB gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html)
- [SST Function runtime support](https://sst.dev/docs/component/aws/function/)
- [Spinel compiler](https://github.com/matz/spinel)
- [Spinel limitations](https://github.com/matz/spinel/blob/master/docs/limitations.md)
