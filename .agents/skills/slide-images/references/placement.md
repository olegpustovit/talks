# Where images belong (and where they do not)

## Use an image when it *is* the argument

- A photograph of the artifact the thesis names (a duplicate
  notification, a shipping box, a real failure screenshot). The room
  must recognize it in under a second.
- An HTML device scene (`Phone`, `Terminal`, `Inbox`) that *is* the
  artifact and can move. Prefer this over a photo of a UI.
- A figure the speaker will zoom (`SlideImage` is zoomable by default).
- A before/after that cannot be a two-line code diff.
- A diagram you drew — prefer SVG in `src/assets/` over a photo of a
  whiteboard if you can redraw it.

Neal Ford *Vacation Photos*: a picture you took of the actual system
beats a stock photo of "a system". Ines Montani: if the idea is too
complex for a flowchart, simplify the idea before it goes on a slide;
do not hide the complexity behind a decorative image.

## Do not use an image when

- You would caption it "teamwork", "innovation", "cloud", or nothing.
- It sits behind a bullet list (Photomaniac, Ford).
- Deleting it would not change the spoken sentence.
- You chose it because the slide "looked empty". Empty is fine. A
  statement slide with one sentence is a pattern, not a defect.
- It is a screenshot of a happy-path dashboard whose only job is to
  show a product logo (marketing).

## Slide construction that images must not violate

From Ford / McCullough / Schutta *Presentation Patterns* and Montani:

- **One idea per slide.** One figure per idea. Two photos is two slides.
- **Assertion title + one visual.** The title is the claim; the figure
  is the evidence.
- **No floodmarks.** Do not repeat a faint background photo on every
  slide. Bookends may carry a mark (`LoopMark`); the rest should not.
- **Ant fonts.** Captions are secondary; they must still read from the
  back row. Prefer one short caption over a paragraph.
- **Live scenes over lists.** A process becomes an animated flow
  (`FlowPlay` + `useFrames`) or an in-slide demo, not five bullets
  next to a stock photo of gears, and not a static 2×2 of tags.

## How to place in this engine

- Import from `../assets/...`. Vite bundles it. The file travels with
  the deck.
- `SlideImage` already provides a figure, optional caption, and click
  to zoom. Do not wrap it in extra chrome.
- Keep the slide body's `max-w-[60ch]` in mind: very wide photographs
  will letterbox. Crop to the subject.
- For code, do not screenshot an editor. Use `RevealCode` or `LiveCode`
  so type stays vector-sharp and you can Traveling-Highlight.

## Caption vs alt vs ATTRIBUTION.md

| Field | Job |
|-------|-----|
| `alt` | What is literally in the picture (accessibility). |
| `caption` | The claim the audience should take ("Batch computing: the program is dead between runs."). |
| `ATTRIBUTION.md` | Photographer, source, license, page URL, date. Always. |
| On-slide credit | Required when the license demands it (CC BY, CC BY-SA). Put a short "Photo: Name / Wikimedia, CC BY-SA" in the caption. Unsplash License does not require on-slide credit; we still record it in ATTRIBUTION.md. Unsplash *API* use requires attributing photographer + Unsplash in the app that displayed search results — the sidecar covers that. |
