---
name: inspiring-talks
description: >
  Analyze Strange Loop–class tech talks (structure, slides, proof, image
  use) and turn those mechanics into concrete guidance for a talk in this
  repo. Covers canonical talks such as Simple Made Easy, Stop Writing Dead
  Programs, Making Hard Things Easy, A Whole New World, and Presentation
  Patterns. Use when the user wants to study a great talk, steal
  structure, compare against Strange Loop, asks what makes a talk
  inspiring, or runs /inspiring-talks.
---

# Inspiring talks

Steal mechanics, not aesthetics. The job is to watch (or read a
transcript of) a Strange Loop–class talk, name what it *does*, and
apply that to a talk in this repo.

Load [references/strange-loop-bar.md](references/strange-loop-bar.md)
for the conference bar and CFP shape. Load
[references/canonical-talks.md](references/canonical-talks.md) for the
corpus. Load
[references/presentation-patterns.md](references/presentation-patterns.md)
for the named patterns we use as a vocabulary.

## Inputs

1. **Source talk** — URL, transcript, or a name from the canonical list.
2. **Target talk** (optional) — `apps/site/src/talks/<slug>` to apply the mechanics to.
   If omitted, write a mechanics brief the next talk can use.

Do not re-host video or slides. Link. Encode the *structure*.

## Procedure

1. State the source talk's **thesis in one sentence**. If you cannot,
   you have not understood it yet — watch further or say so.
2. Map the **narrative** onto beats:

   | Beat | Question |
   |------|----------|
   | Hook | What is already true in the room? |
   | Problem | What breaks if we keep the obvious approach? |
   | Failed obvious | What did we try first, on stage? |
   | Named idea | What word does the speaker introduce? |
   | Proof | Code, live system, or diagram that *is* the argument? |
   | Cost | What does the idea still not save you from? |
   | Bookend | How does the close rhyme with the open? |

3. Inventory **slide mechanics**: assertion titles vs topics; one idea
   per slide; diagrams vs lists; live vs dead demo; traveling
   highlights; images used as evidence vs wallpaper.
4. Inventory **what they refused to do**: no process talk, no product
   tour, no Photomaniac, no slideument.
5. If a target talk was given, write **three transplants** — each is
   `source beat → target file path → what changes`. Prefer structure
   (order of proof, a planted failure, a bookend) over "use a nicer
   font".
6. If no target, write a **mechanics card** the next `new-talk` can
   follow: thesis shape, act outline, proof artifact, image policy.

## Output shape

```markdown
# Mechanics — <source talk>
Thesis: <one sentence>
Proof artifact: <code / live system / diagram / none>

## Beats
- Hook: …
- Problem: …
- Failed obvious: …
- Named idea: …
- Proof: …
- Cost: …
- Bookend: …

## Slide craft
- Titles: …
- Demo: live / dead / none
- Images: evidence / wallpaper / none
- Patterns used: Bookends, Traveling Highlights, …

## Refusals
- …

## Transplants (if a target talk)
1. <source beat> → <path>: <change>
2. …
3. …
```

## Rules

- Apply the Strange Loop bar. A talk that is inspiring because it is a
  keynote about "passion" without a proof artifact is the wrong model
  for this repo unless the user asked for that genre.
- Prefer primary sources (the speaker's transcript, the conference
  about page, the slides). Do not launder a blog recap as if you
  watched.
- When the user has not named a source, start from the canonical list
  in [references/canonical-talks.md](references/canonical-talks.md) and
  pick the one whose *proof style* matches the target (live system →
  Rusher; distinction-between-words → Hickey; diagrams-that-teach →
  Evans; theatrical fake-out → Bernhardt).
- Do not restyle the target talk's theme to imitate Montani's
  collage aesthetic. Steal the *diagram-over-list* rule, not the 70s
  palette.

## Do not

- Do not write a fan essay. Mechanics only.
- Do not add stock photos "because Strange Loop talks have pictures".
  Most of the canonical ones barely do. Do not add punch cards because
  Rusher did — steal the *live system*, not the artifact the room will
  not recognize.
- Do not turn this into a new talk without `new-talk`.
- For a process talk, a static box diagram is not the Evans steal.
  Evans draws the model; we *run* it (`FlowPlay`, in-slide toys).
