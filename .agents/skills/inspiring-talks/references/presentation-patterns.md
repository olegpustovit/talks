# Presentation Patterns we actually use

Vocabulary from Neal Ford, Matthew McCullough, and Nathaniel Schutta,
*Presentation Patterns* (2012), which Ford also gave at Strange Loop
2012. This is not the whole catalog. These are the patterns that
change talks in this repo.

## Narrative

- **Narrative Arc.** Protagonist up a tree, rocks, down. For us: the
  audience's current code is the protagonist. The crash is the rock.
- **Triad.** Three acts, or three questions the close returns to.
- **Expansion Joints.** Named cuts in `RESEARCH.md` so a 40-minute
  talk becomes 25 without a new story. "Talk faster" is not a joint.
- **Talklet.** A 5–10 minute version of the thesis you could give
  with three slides. If you cannot, the thesis is not one thesis.
- **Foreshadowing.** Plant the constraint (idempotency, replay
  compatibility) before you name the product.
- **Bookends.** Title and closing share a visual mark and the close
  restates the thesis as a Monday action. `LoopMark` on Title +
  Closing is the local implementation.
- **Coda.** A last slide that is not "Questions?" alone — a first
  experiment, a link, a question for the room.
- **Celery** (antipattern). Healthy-looking filler: agenda recap,
  "about me" beyond one line, section divider slides with no claim.

## Slides

- **One idea / assertion titles.** Not in the book under that name;
  it is the conjunction test we enforce: if the title has "and",
  split. Topic titles ("Architecture") are *Injured Outlines*.
- **Bullet-Riddled Corpse.** Nested bullets of the speaker outline.
  Put the outline in `<SpeakerNote>`.
- **Slideuments.** A deck that is also the handout. Our slides are
  the visual channel; `RESEARCH.md` is the handout.
- **Ant Fonts.** Type too small for the back row.
- **Fontaholic.** Too many typefaces. We have a theme for a reason.
- **Floodmarks.** Logo / watermark / faint photo on every slide.
  Branding lives on bookends.
- **Photomaniac.** Stock photos and clip-art as empty-space filler.
  See skill `slide-images`.
- **BoxGrid** (antipattern). A 2×2 of tagged boxes that restate the
  title. If the system moves, the slide must move (`FlowPlay`, a
  device scene, a click-driven toy). Static boxes are PowerPoint.
- **Museum Piece** (antipattern). A punch card, loom, or mainframe
  the room will not recognize in under a second, used as "visual
  interest." History talks may use them. A Python meetup about
  retries may not.
- **Unifying Visual Theme.** One accent, one graphic language, via
  `theme.ts`.
- **Vacation Photos.** A picture of the *actual* system beats stock.
- **Greek Chorus.** A recurring character or mark that comments
  (our `LoopMark`, Evans's repeated diagram shape).
- **Context Keeper / Breadcrumbs.** A kicker (`<Tag>`) that says
  which act we are in, not a second thesis.

## Demos

- **Live Demo.** The real system, on stage, proving the thesis.
- **Dead Demo.** A recording, a `LiveCode` snippet, `ReplayDemo`,
  `FlowPlay` frames, or `RevealCode` steps that survive a dead
  network. Ship one. A live demo without a dead demo is a single
  point of failure. In-slide toys are the default dead demo for
  process talks — they *are* the slide.
- **Traveling Highlights.** One region of code or a diagram is
  emphasized at a time. `RevealCode` steps are the local
  implementation. An 80-line dump is not.
- **Á la Carte Content.** Optional deep dives you can skip live
  (the omit list in `RESEARCH.md`).

## Prepare

- **Know Your Audience.** Written in `RESEARCH.md`, not guessed
  from the conference name.
- **The Big Why.** Why this talk exists *now* for *this* room.
- **Abstract Attorney** (antipattern). An abstract that would not
  survive Strange Loop review: too vague, or a product ad.
- **Peer Review.** This is skill `talk-feedback`. Do it a week out.

## When analyzing a talk

Name the patterns you see and the antipatterns you see. "It felt
inspiring" is a heart. "Bookends: the punch-card photo from minute
2 returns as a live overlay at minute 38" is a mechanic.
