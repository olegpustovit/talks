# Canonical talks

Do not re-host. Link, then encode mechanics. Prefer the speaker's own
transcript when it exists.

## Simple Made Easy — Rich Hickey (Strange Loop 2011)

- Video: https://www.youtube.com/watch?v=SxdOUGdseq4
- Transcript: https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md
- **Thesis:** Simple (unentangled) is not easy (familiar / at-hand).
  Reliability requires simplicity; we keep choosing constructs that
  complect.
- **Proof:** Etymology as a tool, then two columns — a complexity
  toolkit vs a simplicity toolkit — applied to state, objects, ORM.
- **Slide craft:** Sparse slides, word-origins, tables. The talk is
  spoken. Titles are distinctions, not topics. Almost no photography.
- **Structure:** Define terms → show why the confusion is expensive →
  walk constructs → close on choice ("Simplicity is a Choice", then
  "Simplicity Made Easy"). Bookends are conceptual, not a logo.
- **Steal:** Make the audience give up a word they think they know.
  Put the product (Clojure) *after* the distinction, as an existence
  proof, not as the pitch.

## Stop Writing Dead Programs — Jack Rusher (Strange Loop 2022)

- Video: https://www.youtube.com/watch?v=8Ab3ArE8W3s
- Transcript: https://jackrusher.com/strange-loop-2022/
- **Thesis:** Most new languages are accidentally backwards-compatible
  with punchcards. We should build live programming environments.
- **Proof:** A live system on stage. Punch-card history as the
  "failed obvious" that we still live in. Demos of livelits, visual
  overlay, in-program compilation. Chapters: batch processing →
  representation → visual cortex → Lisp → types → debugging → future.
- **Slide craft:** The demo *is* the slide for long stretches. Images
  that appear are artifacts (punch cards, historical machines), not
  stock. Traveling attention follows the running program.
- **Steal:** If you claim liveness, show liveness. Have a dead-demo
  fallback (recording / `LiveCode`) because projectors fail. Plant
  the punch card *before* the manifesto.

## Making Hard Things Easy — Julia Evans (Strange Loop 2023)

- Video: https://www.youtube.com/watch?v=30YWsGDr8mA
- Transcript/slides: https://jvns.ca/blog/2023/10/06/new-talk--making-hard-things-easy/
- **Thesis:** Bash, HTTP, SQL, DNS stay hard because of hidden
  machinery, gotchas, and bad explanations — and we can make them
  easier with small mental models, linters, and honest diagrams.
- **Proof:** Repeated structure per topic: (a) what is hard, (b) what
  would make it easier. Hand-drawn diagrams (HTTP headers she actually
  uses; DNS as browser → function → cache → authority).
- **Slide craft:** Diagrams over lists. Subjective "here is what *I*
  know" as a feature. No product. Zines are the existence proof of
  the method, shown after the method.
- **Steal:** A repeating two-beat template the audience can predict.
  Draw the model; do not paste an RFC. Admit the map is personal.

## A Whole New World — Gary Bernhardt (Strange Loop 2012)

- Notes: https://gist.github.com/jasonrudolph/3763157 (search the
  heading). Video circulates independently of the official channel.
- **Thesis:** Our "shipping culture" and inherited tools (terminals,
  editors) make us treat infrastructure as weather. We could rebuild
  it — and the fact that a fake demo was believable is the proof that
  we wanted it.
- **Proof:** A theatrical live demo of "aneditor" / "anterminal"
  (layers, crash overlay, graph navigation in a terminal) which is
  then revealed as a fake. The fake-out *is* the argument.
- **Slide craft:** The demo carries the first half. The second half
  is almost bare: why we were surprised, why incremental shipping
  cannot produce that editor.
- **Steal:** A committed fake-out is allowed when it is the proof.
  Do not use this for a product launch. Label it in `RESEARCH.md` so
  feedback does not treat the fake as a lie to the committee.

## Applying Presentation Patterns — Neal Ford (Strange Loop 2012)

- Session: https://www.thestrangeloop.com/2012/applying-presentation-patterns-sharpen-your-talks.html
- Book: Ford, McCullough, Schutta, *Presentation Patterns* (Addison-Wesley, 2012)
- **Thesis:** Presentations have a pattern language. Named patterns
  and antipatterns let you talk about talks at a higher level than
  "more pictures" / "fewer bullets".
- **Proof:** The catalog itself, given as a talk. See
  [presentation-patterns.md](presentation-patterns.md).
- **Steal:** Use the vocabulary in feedback and in `RESEARCH.md`
  (Bookends, Photomaniac, Live Demo, Traveling Highlights, Expansion
  Joints). Do not turn our decks into a tour of the book.

## Slide craft reference (not a Strange Loop talk, but the visual bar)

Ines Montani, *A beginner's guide to making beautiful slides* and
part 3 *Technical content* (ines.io):

- Slides support the talk; they are not the talk. Short summaries,
  not paragraphs.
- Diagrams and flowcharts over lists. If it will not fit a flowchart,
  the idea is not ready.
- One aesthetic through-line (type, color, graphic style). Steal the
  discipline, not her collage look.
- Code: highlight and annotate; ellipses for boilerplate; no
  low-resolution editor screenshots.
- "Appear" is the only animation that survives a PDF fallback.

## How to pick a model for a target talk

| Target needs | Start from |
|--------------|------------|
| A distinction the industry confuses | Hickey |
| A live programming / runtime claim | Rusher |
| Teaching a supposedly-basic system | Evans |
| A cultural / tools argument | Bernhardt |
| Slide and rehearsal vocabulary | Ford |
| Diagrams for dry technical material | Montani |
