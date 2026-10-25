# Local capture

Captured on 23 October 2026 from base revision `26eb1d4a532eb7cca6dcdc7b7e96bd9903caab4c` with the documentation and example changes in this commit.

Bun 1.3.13 on Linux ARM64 installed the locked dependencies. The frontend type check, production build, 17 script tests and 15 slide-engine tests passed. Vite reported a large output-chunk warning. Chromium rendered the local production index at 1440 by 1000 with external requests blocked. A registered deck was opened directly and advanced by keyboard to hash #3 without page errors. The index screenshot contains only deck navigation, not speaker notes or client material. No Go embed build, remote-control pairing, external deployment or delivery/publication verification was performed.

Commands from the repository root unless noted:

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
bun test
bun run build
# From apps/site in a second terminal:
bun run preview --host 127.0.0.1 --port 8158
```
