@AGENTS.md

# Talks — how to handle work in this repo

This file is always-on. Keep the Strange Loop bar, slide/image rules, and
skill routing below. Long research, rubrics, and source lists live in
`.agents/skills/*/references/` — load those only when the matching skill
is in play.

## Strange Loop bar

Strange Loop's own principles (thestrangeloop.com/about.html):

- **Tech, not process.** Talks are code-heavy, not agile/testing/process
  theatre. There are conferences for process; this is not one of them.
- **No marketing.** A talk that reads as a product ad is out. Teach a new
  idea or technique; name a tool only as the implementation of that idea.
- **Technology stew.** Academia, industry, and a touch of weirdness.
  Interesting stuff happens when different areas share a room.

What that means for every talk we write, review, or scaffold:

1. **One thesis**, stated in `RESEARCH.md` and proved on stage. Not a
   topic tour. Not a feature list.
2. **Proof with code or a live system** — a tiny teaching runtime, a
   failing experiment, a diagram that is the argument. The audience should
   be able to *use* the idea, not just remember the brand.
3. **Bookends.** Title and closing slides rhyme: same visual mark, the
   closing restates the thesis as something the room can do on Monday.
4. **One idea per slide.** Assertion titles ("The crash between two
   writes"), not topic titles ("Overview"). If the title contains "and",
   split the slide.
5. **Slides support the voice.** They are not the transcript. The spoken
   argument lives in `<SpeakerNote>`. If the slide can be read silently
   as the whole talk, it is too dense.
6. **Honest cost.** Tradeoffs, constraints, and "this still won't save
   you" beats a pitch.

When the user asks to start a talk, review one, steal structure from a
great talk, or place an image, invoke the skill in **Skill routing**
below. Do not wait to be asked to apply this bar — it is the default.

## Skill routing

Skills live in `.agents/skills/` (synced with `.claude/skills` by
`bun run sync:claude`). Existing `new-talk` still scaffolds from
`templates/talk`.

| When | Skill |
|------|--------|
| Scaffold a new React deck under `apps/site/src/talks/<slug>` | `new-talk` |
| Critique, rehearsal review, rubric, "is this good enough", `/talk-feedback` | `talk-feedback` |
| Find/place a photo, Unsplash, Wikimedia, "do we even need an image", `/slide-images` | `slide-images` |
| Analyze a Strange Loop–class talk, steal mechanics, `/inspiring-talks` | `inspiring-talks` |

Load `SKILL.md` first. Open `references/` only when the procedure says to.

## Slides as support, not wallpaper

- This is a web deck, not PowerPoint in a browser. If it moves in the
  system, it moves on the slide: `FlowPlay` / `useFrames` (arrow keys
  play the beat), `ReplayDemo` and other click-driven toys, `Phone` /
  `Terminal` / `Inbox` scenes. A static 2×2 of tagged boxes restating
  the title is an antipattern.
- A short code excerpt (`RevealCode` / `LiveCode`) or one sentence still
  beats a stock photo. An in-slide demo beats a screenshot of a demo.
- An image belongs when it **is the evidence** and the room will
  recognize it in under a second (duplicate lock-screen banners, a
  shipping box, a killed worker log). Historical artifacts (punch cards,
  Jacquard looms) fail that test for a typical meetup unless the talk is
  *about* history. Use `SlideImage` with a real `alt` and a caption that
  states the claim.
- An image does **not** belong as decoration, mood, or empty-space filler
  (Photomaniac). No Unsplash hero of a laptop on a desk behind a
  bullet list. No hotlinked CDNs — files live in
  `apps/site/src/talks/<slug>/assets/` and are imported. See `slide-images`.
- Kickers (`<Tag>`) are section labels, not a second thesis.
- Theme through `theme.ts` + `mergeTheme` and `--se-*` tokens. Do not
  hardcode a one-off palette in talk CSS.

## Conventions — new talks

React decks live under `apps/site/src/talks/<talk-slug>/` on
`@talks/slide-engine`, served by the single Vite app `apps/site`.
Legacy plain-HTML decks stay under `meetups/` and are not the default.

Layout of a new talk (from `templates/talk`):

- `App.tsx` — `<Deck>` composing one component per slide, in order
- `slides/` — one file per slide; keep `Title.tsx` and `Closing.tsx`
- `theme.ts` — `mergeTheme({ ... })`
- `assets/` — local images only; `ATTRIBUTION.md` for sourced photos
- `RESEARCH.md` — thesis, audience, timing table, sources, code assumptions
- `CFP.md` — proposal text (title, 3–5 sentence abstract, takeaways)
- Register the talk in `apps/site/src/talks/registry.ts` (index + `/t/<slug>`)

Do not add a new talk to `meetups/<meetup>/README.md`. Do not copy a
sibling under `apps/site/src/talks/` instead of `templates/talk`. Do not
add another Vite app under `apps/` for a deck. Reusable interactive
pieces go in `packages/slide-engine/src/components/`, not the talk folder.

## Feedback timing (when reviewing)

- **Week before:** content and structure. Rearrange, cut, rewrite thesis.
- **Day before:** delivery only. Do not rearrange the deck.
- **Immediately after the live talk:** only specific good. No "but".
- **After a recording:** full debrief against the `talk-feedback` rubric.

Cite the slide or the moment. Empty praise is not feedback.

## Skill sync

`.agents/` is what git tracks. `.claude/` is gitignored. Skills sync
**bidirectionally** (conflict unit = skill directory; newer mtime wins).
Non-skill `.agents` content still mirrors into `.claude`. Claude runtime
(`settings.json`, `settings.local.json`, `worktrees`) is never touched.
After editing a skill on either side, run `bun run sync:claude` so the
winner lands in `.agents/skills` and can be committed.
