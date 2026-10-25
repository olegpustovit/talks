# spinel-lambda — Ruby, compiled ahead of time, as a Lambda custom runtime

`src/handler.rb` is an ordinary-looking Ruby program. [Spinel](https://github.com/matz/spinel)
compiles it to C, `zig cc` cross-compiles that C for `aarch64-linux-musl`, and the
resulting static binary is uploaded as the `bootstrap` of a `provided.al2023`
function behind a public Function URL. The page it serves (live facts, a per-copy request history, a
round-trip chart fed by `?format=json`, highlighted source) is what the slide shows in an iframe; the slide reads the URL from
`endpoint.json`.

## What is Spinel-compiled, what is not

| Part | What it is |
|---|---|
| `src/handler.rb` | **All of the runtime logic, compiled by Spinel**: the Runtime API loop (`GET /2018-06-01/runtime/invocation/next`, `POST .../response`), a tiny HTTP/1.1 client over `TCPSocket`, JSON parse/generate, the prime sieve, the HTML. |
| Spinel runtime (C) | `vendor/spinel/lib/*.c`, `lib/regexp/*.c`, `packages/json/sp_json.c` — Spinel's own GC/string/hash/socket/JSON runtime, statically linked. Same thing `spinel` links natively (`libspinel_rt.a`). |
| libc | musl, statically linked by `zig cc`. |
| Shim | **None.** No shell bootstrap, no C `main` of ours, no interpreter. `bootstrap` *is* the compiled Ruby program. |
| Build-time only | CRuby (one line in the Makefile embeds the source as a string; Spinel itself also needs CRuby to bootstrap), `scripts/fake_runtime.rb` (local test server, never deployed). |

## Build / deploy / teardown

Needs: `zig` (`brew install zig`), CRuby, `git`, AWS CLI v2.

```sh
make build      # clone+build Spinel at SPINEL_REV, Ruby -> C -> static aarch64 ELF -> build/function.zip
make deploy     # role (AWSLambdaBasicExecutionRole only) + function + public URL; writes endpoint.json
make smoke      # curl the URL (status, headers, cold/warm, Ruby work time)
make cold       # change an env var to retire warm sandboxes, then curl -> a cold start
make logs       # REPORT lines; "Init Duration" only appears on cold starts
make status
make teardown   # URL config, function, role (+ policy attachment), log group. Safe to re-run.
make local      # host build vs. scripts/fake_runtime.rb, no AWS
```

Variables (top of `Makefile`): `PROFILE=rubyzg-talk REGION=eu-central-1 ARCH=arm64
FUNCTION=rubyzg-spinel-demo MEMORY=1769`. Resources are tagged `project=rubyzg-talk`.

`deploy` is idempotent: it updates code and configuration when the function exists.
A public URL (`AuthType NONE`) needs two resource-policy statements since October 2025:
`lambda:InvokeFunctionUrl` (with `FunctionUrlAuthType=NONE`) **and** `lambda:InvokeFunction`
(with `InvokedViaFunctionUrl=true`) —
[docs](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html). `deploy.sh` adds both.
The response sets no `X-Frame-Options` or CSP, so the page can be iframed.

## Why 1769 MB

The program uses ~20–30 MB. Memory is set to 1769 MB because that is one full vCPU:
at 128/256 MB Lambda gives a fraction of a core and the ~4 ms sieve gets throttled
to 10–60 ms of wall time. Measured on this function (2026-10-22, arm64):

| Memory | Init Duration (cold) | Duration |
|---|---|---|
| 1769 MB | 13.8–17.7 ms (4 cold starts) | cold 5.7–8.7 ms, warm 4.1–8.5 ms (16 warm) |
| 256 MB | 12.5–13.8 ms (4 cold starts) | 8.8–45.0 ms (17 samples) |
| 128 MB | 10.7 ms (1) | 21–62 ms (6 samples) |

## Spinel pin

`SPINEL_REV=0e7b469de6948268aed3986628dc4830df01bbcc` (master, 2026-10-22). The cross
build mirrors what `spinel` does natively: `spinel handler.rb -c` emits one C file, which
is linked against the runtime sources compiled for the target (see the `XFLAGS` /
`RT_MEMBERS` comments in the Makefile; the flags are the ones `spinel --cc=<wrapper>` shows).
