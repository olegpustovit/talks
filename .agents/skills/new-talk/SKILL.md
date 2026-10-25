---
name: new-talk
description: Scaffold a new React slide-deck talk under apps/site/src/talks/<talk-slug> from templates/talk, wired up on @talks/slide-engine and registered on the site index. Use when starting a new conference or meetup talk in this repo (not for the legacy meetups/ plain-HTML decks).
---

# New talk

Scaffolds a new talk under `apps/site/src/talks/<talk-slug>`, built on the
shared `@talks/slide-engine` framework and linked from the site index. See
the root `AGENTS.md` ("Conventions — new talks" and the Strange Loop bar)
for the full layout and conventions this skill follows. After the scaffold
exists, use `inspiring-talks` to steal structure, `slide-images` only when
a figure is evidence, and `talk-feedback` for a week-before rubric pass.

## Steps

1. Ask for (or infer from context) the talk's title, the meetup/conference
   it's for, and a kebab-case slug for the folder name.
2. Copy the template:
   ```sh
   cp -R templates/talk/src apps/site/src/talks/<talk-slug>
   ```
   Optionally copy `templates/talk/README.md` into that folder and replace
   placeholders, then add `RESEARCH.md` / `CFP.md` beside the deck.
3. Register the talk in `apps/site/src/talks/registry.ts`: import its
   `App`, and append a `{ slug, title, event?, summary, component }` entry
   so the index and `/t/<slug>` route pick it up.
4. Replace every `[bracketed]` placeholder across the copied files
   (`App.tsx`'s `title` prop, `slides/*`, `README.md`) with real content.
   Grep for them to make sure none are left:
   ```sh
   grep -rn '\[' apps/site/src/talks/<talk-slug>
   ```
5. Delete or replace the placeholder slides in `slides/` — keep
   `Title.tsx` and `Closing.tsx` as a starting shape, replace
   `LiveCodeDemo.tsx` / `InteractiveDemo.tsx` / `ImageDemo.tsx` with the
   talk's actual content, or delete what isn't needed. Every slide is one
   component, composed in order inside `<Deck>` in `App.tsx`. Process
   slides should use `FlowPlay` + `useFrames` (arrow keys play the beat),
   `Phone` / `Terminal` / `Inbox` for UI evidence, and click-driven toys
   (`ReplayDemo`, `Button`) when the speaker should operate the proof.
   Slide wrappers stay hookless (`getSlideTitle` calls them as functions);
   put hooks in a child demo component. Do not ship a 2×2 of tags.
6. If the talk needs a distinct look, adjust `theme.ts` via `mergeTheme`
   — don't hardcode colors or fonts in talk-specific CSS; use the `--se-*`
   theme tokens the base engine already exposes.
7. Add `RESEARCH.md` and `CFP.md` next to the deck if this talk needs a
   speaker brief / conference proposal (see the legacy `meetups/*/RESEARCH.md`
   and `CFP.md` files for the expected shape — thesis, sources, timing, Q&A
   prep; proposal text respectively).
8. From the repo root:
   ```sh
   bun install
   bun run dev
   ```
   Open `/` and confirm the new talk is listed, then open `/t/<talk-slug>`
   and confirm the placeholder content is gone.

## Do not

- Do not add the new talk to any `meetups/<meetup>/README.md` — that index is
  for the legacy plain-HTML decks only.
- Do not copy a sibling talk under `apps/site/src/talks/` instead of
  `templates/talk` — it will carry that talk's specific content and slide
  choices.
- Do not add a second Vite app under `apps/` for a new deck — the site is
  the only React entrypoint.
- Do not add new interactive/embeddable components inside the talk's own
  folder — put reusable ones in `packages/slide-engine/src/components/` so
  every talk can use them.
