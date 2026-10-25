# Running Ruby apps on AWS Lambda

A small HTTP API needs a home, even when the core product already runs elsewhere. We follow a Ruby application onto Lambda, remove Rails and its adapter to expose the invocation contract, then rebuild the Rack bridge. The experiment explains startup, uploads, durable jobs and database boundaries before assembling an application with SST. Finally, a working Spinel prototype asks what ahead-of-time compilation changes about startup and the development loop.

Takeaways:

- Explain the event-to-Rack translation and its HTTP compatibility costs.
- Choose Lambda boundaries around initialization, data access and durable work.
- Compare startup improvements with build, review and maintenance costs.
