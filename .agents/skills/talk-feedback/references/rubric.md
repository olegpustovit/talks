# Talk feedback rubric

Score each dimension `strong` / `workable` / `weak` / `not evidenced`.
A `weak` or `not evidenced` on **Content** or **Narrative** blocks a
"ready to give" verdict. Cite at least one slide or `RESEARCH.md` line
per dimension.

## 1. Content

- **Thesis.** One sentence the audience could repeat. Written in
  `RESEARCH.md`. The deck argues it; it does not assume it.
- **Strange Loop bar.** Tech, not process. Not a product ad. A new idea
  or technique, with the tool as an implementation of that idea.
- **Proof.** Code, a failing experiment, a tiny runtime, or a system the
  speaker actually runs. Abstract claims without an artifact are weak.
- **Honest cost.** Constraints, failure modes, "this still will not save
  you." A talk that only sells is marketing.
- **Audience fit.** Prerequisites stated. Takeaways are things a person
  in that room can do.

Fail if: you cannot state the thesis; the talk is a feature tour; the
proof is a screenshot of a dashboard with a logo.

## 2. Narrative

- **Bookends.** Title and closing rhyme (visual mark + restated thesis
  as a Monday action). Neal Ford *Bookends*.
- **Arc.** Get the protagonist up a tree, throw rocks, get them down
  (Syd Field via Ford). Problem → failed obvious solution → named idea →
  working proof → cost → what you do next.
- **Foreshadowing.** The crash / constraint that will matter later is
  planted before the product appears.
- **Expansion joints.** A timed cut exists in `RESEARCH.md` so a 40
  minute talk can become 25 without a new story.
- **Celery test.** No slides that are healthy-looking filler (agenda
  recap, "about me" beyond one line, "questions?" as the only close).

Fail if: the product appears before the problem; the close is only a
logo and a URL.

## 3. Slides

- **One idea per slide.** Conjunction test: if the title has "and",
  split it. Assertion titles, not topic titles ("The crash between two
  writes" not "Architecture").
- **Support, not transcript.** Body is a live scene, a short excerpt, or a
  sentence. The argument is spoken. If the slide is readable as the
  whole talk, it is a *Slideument*. A process rendered as a static 2×2
  of tags is *BoxGrid* — weak. `FlowPlay` / a device scene / a toy the
  speaker clicks is the expected proof.
- **Ant fonts / floodmarks.** Type is huge. No footer logo on every
  slide. Branding lives on bookends.
- **Injured outlines.** No slide that is just a nested bullet dump of
  the speaker's outline.
- **Unifying visual theme.** One accent, one type system, via
  `theme.ts` — not a new aesthetic every section.

Fail if: three ideas compete on one slide; the title is "Overview".

## 4. Code / demo

- **Live Demo vs Dead Demo** (Ford). A live system the speaker can
  recover from is better than a video, which is better than a
  screenshot of a happy path. A demo that only works on the author's
  laptop with no fallback is a liability — ship a `RevealCode` /
  `LiveCode` / recorded cut as the dead-demo backup.
- **Traveling Highlights.** When showing code, one region is emphasized
  at a time (`RevealCode` steps, not a 80-line dump).
- **The demo proves the thesis.** It is not a feature walkthrough.
- **Recovery.** Speaker notes say what to do if the network dies.

Fail if: the only proof is a slide titled "Demo" with a terminal
screenshot and no spoken experiment.

## 5. Images

- **Meaning, not wallpaper.** The figure *is* the evidence, or it is
  absent. Photomaniac (stock photo of a handshake / laptop / mountain
  behind bullets) is a fail for that slide. A punch card in a room that
  will not recognize it is a *Museum Piece* — same fail.
- **Local assets.** Imported from `src/assets/`. No hotlinked Unsplash
  or CDN URLs as a runtime dependency.
- **Caption states the claim.** `SlideImage` `alt` describes the
  picture; `caption` states what the audience should take from it.
- **Attribution** recorded in `src/assets/ATTRIBUTION.md`.

See skill `slide-images` for placement rules. Fail if a stock photo
could be deleted with no change to the argument.

## 6. Timing

- A timing table exists (slide × minutes) and adds up to the slot,
  including Q&A.
- Average dwell is plausible (about 1–2 minutes per idea slide; title
  and close can be shorter).
- Expansion joints are named, not "talk faster".
- Click-reveals and code steps are counted in the dwell time.

Fail if: 26 slides in 15 minutes with no cut list, or 8 slides in 40
minutes of undirected live-coding.

## 7. Speaker notes

- Every slide has a `<SpeakerNote>` that is the spoken beat, not a
  paste of the slide body.
- Notes include time codes and stage directions ("pause", "ask the
  room") where the beat needs them.
- Notes do not fight the slide (reading the bullets aloud).

Fail if: half the deck has empty notes, or notes are the slide title
repeated.

## Verdicts

- **Ready to give** — Content and Narrative are `strong` or `workable`;
  no `weak` on proof; timing adds up.
- **Ready after the Monday list** — at most three high-leverage edits,
  all inside the timing mode.
- **Not yet a talk** — no thesis, or no proof, or it is still a product
  tour. Say so.
