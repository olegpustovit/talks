# Talks

React slide decks in one Vite app (`apps/site`), plus legacy plain-HTML
decks under `meetups/`.

## Structure

```text
talks/
  apps/site/                 # single React app
    src/
      Home.tsx               # index with links to each talk
      talks/
        registry.ts          # list + routes
        <talk-slug>/         # one deck per folder
  templates/talk/            # scaffold copied by new-talk
  packages/slide-engine/     # shared Deck / Slide / demos
  meetups/                   # legacy plain-HTML decks
```

Written pieces live under `articles/<program>/<article>/` — see
[`articles/aws-community-builder/`](./articles/aws-community-builder/).

## Run

```sh
bun install
bun run dev          # Vite on :5173 (proxies /ws → Go :1578)
bun run dev:server   # Go embed server on :1578 (needed for phone remote)
```

Open the Vite root URL for the index, or `/t/<talk-slug>` for a deck.
Slide position still uses the URL hash (`#3`). Phone remote: `/remote`.

Production is a single Go binary that embeds the Vite build and listens on
port `1578` (`slides.microapps.space` → Caddy → that port):

```sh
make build           # local binary in bin/slides
make deploy          # linux/arm64 → oracle-vm + smdctl
```

## Frontend-only deployment

The public frontend is intended for https://talks.olegpustovit.com on Cloudflare
Pages. It runs entirely in the browser, with keyboard, touch, fullscreen, and
speaker notes. Phone remote control requires the separate Go deployment.

```sh
bun run build:static
bunx --no-install wrangler pages deploy apps/site/dist --project-name=talks --branch=master
```

Pages serves `apps/site/dist`; its default SPA fallback handles `/t/<slug>`.
For automatic deployments, connect `olegpustovit/talks` to Cloudflare Pages,
select `master`, set the build command to
`bun run typecheck && bun run build:static`, output directory to
`apps/site/dist`, and `BUN_VERSION=1.3.13`.
The GitHub Actions workflow independently checks the frontend on pushes and PRs.
Cloudflare's GitHub integration deploys without a Cloudflare secret in GitHub.
Associate `talks.olegpustovit.com` with the Pages project, then point that
hostname's CNAME at the project's assigned `pages.dev` domain.

For Go deployments, copy `smdctl.yml` to the ignored `smdctl.local.yml` and set
`SLIDES_PASSWORD` there. `make deploy` requires that private local file. Never
commit passwords, Cloudflare tokens, `.env` files, or local deployment config.

## Controls (inside a deck)

- `Right Arrow`, `Space`, or `Page Down`: next substep / slide
- `Left Arrow` or `Page Up`: previous substep / slide
- `Home` / `End`: first / last slide
- `F`: enter or leave fullscreen
- `N` or `S`: speaker notes
- Swipe left or right on touch screens
- Phone: open `/remote` and tap Next / Prev (WebSocket to the presenting deck)

## Start another talk

Use the `new-talk` skill (or copy `templates/talk` into
`apps/site/src/talks/<slug>` and register it in `registry.ts`).
