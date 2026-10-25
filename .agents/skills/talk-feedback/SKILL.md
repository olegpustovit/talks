---
name: talk-feedback
description: >
  Give structured, evidence-cited feedback on a tech talk in this repo
  (slides, RESEARCH.md, CFP, speaker notes, demos). Uses a checkable
  rubric: content, narrative, slides, code/demo, images, timing, speaker
  notes. Every note cites a slide or moment and is a what/why/how triad —
  not empty praise. Use when the user asks for talk feedback, a critique,
  a rehearsal review, a rubric, "is this good enough", wants notes on a
  deck, or runs /talk-feedback.
---

# Talk feedback

Review a talk the way a Strange Loop program committee plus a rehearsal
partner would: specific, timely, evidence-based. Diamonds and spades only
(specific good, specific fix). Hearts ("great intro!") and clubs ("the
middle was confusing") are not feedback.

Load [references/rubric.md](references/rubric.md) for the checkable
dimensions and scoring. Load [references/timing.md](references/timing.md)
for which kind of feedback this moment allows. Load
[references/output-shape.md](references/output-shape.md) before writing.

## Inputs

Ask only if missing:

1. **Which talk** — `apps/site/src/talks/<slug>` or a legacy `meetups/...` deck.
2. **When** — week-before / day-before / immediately-after / after-recording
   (default: week-before if the talk has not been given).
3. **Constraint** — slot length, audience, conference bar (default: the
   Strange Loop bar in root `AGENTS.md`).

## Procedure

1. Read `RESEARCH.md` and `CFP.md` if they exist. Quote the thesis in one
   sentence. If you cannot, that is already a finding.
2. Read the talk's `App.tsx` (or the HTML deck) for order. Skim every
   slide component and its `<SpeakerNote>`. Do not review from titles alone.
3. Score each rubric dimension in [references/rubric.md](references/rubric.md).
   A dimension that is silent is a miss — write "not evidenced" rather than
   skipping it.
4. Collect **at most seven** findings. Rank by how much they change what
   the audience can take home. Drop nits until the thesis, proof, and
   timing are sound — unless the mode is day-before, in which case you
   may only touch delivery.
5. Write the report in the shape in
   [references/output-shape.md](references/output-shape.md). Every finding
   is **what / why / how**, citing `SlideTitle` or a timestamp.
6. Close with a **Monday list**: three concrete edits, in file paths, the
   speaker can finish without you.

## Rules

- Do not praise without a citation. "Nice narrative" is a heart; "Slide
  `The crash between two writes` names the failure before the product"
  is a diamond.
- Do not invent audience reactions. Infer from the artifact.
- Do not restyle the deck unless the user asked. Feedback is the
  deliverable; patches only when asked to apply the Monday list.
- Respect the timing mode. Week-before may say "cut slides 16 and 18".
  Day-before may not.
- Apply the Strange Loop bar: tech not process, no marketing, thesis
  proved with code or a live system, one idea per slide, slides as
  support.

## Do not

- Do not give a numeric "overall score" as the headline. Lead with the
  thesis verdict and the three highest-leverage edits.
- Do not comment on the speaker's identity, accent, or appearance.
- Do not expand the talk into a blog post in the notes.
