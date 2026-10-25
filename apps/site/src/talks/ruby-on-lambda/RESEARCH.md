# Running Ruby apps on AWS Lambda

Thesis: Keep a small HTTP application's Ruby and Rack boundary while choosing an execution environment deliberately. Startup, durable work and data access determine whether Lambda fits; native compilation is a separate experiment.

Audience: RubyZG developers familiar with web applications, not necessarily Lambda or Rack internals.

Event: RubyZG, 22 October 2026. Presenter: Oleg Pustovit.

## Source and fidelity

Ported from https://artifacts.microapps.space/a/bx9sv102cxmx, version 8, index.html SHA-256 `1eb5132925b48e09d6a2a737490e529a77c6485c1e6c85928bb48baff9c25130`.
All 24 slides retain their titles, subtitles, editable SVG diagrams, three reveal cues, full speaker paragraphs and source links. Scroll-driven scenes become slide-engine keyboard and remote steps. Motion respects reduced-motion settings. No iframe or artifact service is required at runtime.

## Rehearsal timing

Proposed pacing, not a measured rehearsal:

| Slides | Argument | Minutes |
| --- | --- | --- |
| 1–4 | The small API boundary | 4 |
| 5–9 | Lambda, Rails boot and the bare handler | 7 |
| 10–14 | Rebuild the Rack bridge | 8 |
| 15–19 | Constraints and application infrastructure | 7 |
| 20–23 | JIT, iteration cost and Spinel | 7 |
| 24 | Choose the next small API | 1 |

## Code and evidence assumptions

The code in the diagrams is teaching material, not a complete adapter. HTTP examples target payload v2; real headers, cookies, binary bodies and lifecycle cleanup require a maintained integration. No AWS resources are provisioned by this deck.
The Rails baseline and Spinel logs are external presenter demonstrations, not bundled or remeasured by this port. The under-9-ms figure remains a presenter-reported prototype observation; it is not verified AWS Init Duration or HTTP latency. Do not invent Rust comparison numbers. Check current runtime support before presenting the SST example.

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
