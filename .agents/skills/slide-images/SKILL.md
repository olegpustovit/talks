---
name: slide-images
description: >
  Source public images (Unsplash, Wikimedia Commons, optional Pexels) into
  a talk's local assets, record attribution, and decide whether an image
  belongs on the slide at all. Use when the user wants a photo, figure,
  Unsplash, Wikimedia, stock image, caption, Photomaniac check, slide
  placement advice, or runs /slide-images. Never hotlink remote photos as
  the deck's runtime dependency.
---

# Slide images

Images are evidence, not wallpaper. Most Strange Loop–class slides should
have **no stock photo**. A live web scene (`FlowPlay`, `Phone`,
`Terminal`, an in-slide demo) or a short code excerpt beats an Unsplash
laptop *and* beats a static box-and-arrow grid.

Load [references/placement.md](references/placement.md) before searching.
Load [references/sources.md](references/sources.md) for licenses, API
keys, and fallbacks.

## Decide first (do not skip)

Ask: *if I delete this picture, does the argument change?*

- **Yes** — it is evidence (the duplicate notification, the killed
  worker log, the figure you will zoom). Proceed.
- **No** — it is Photomaniac / mood / empty-space filler. Do not fetch.
  Suggest a live scene, `RevealCode`, or a statement slide instead.

Then ask: *will this room recognize the object in under a second?*

- A 30-year-old Python meetup will not get a punch card or a Jacquard
  loom. Those are history-talk artifacts, not default evidence.
- Prefer the actual system: a lock-screen banner, an inbox row, a
  `journalctl` line, a shipping box. HTML `Phone` / `Terminal` /
  `Inbox` scenes count as images and are usually better than a photo
  of a UI (text stays sharp, they can animate).

Never use a photo to "add visual interest" behind bullets.

## Procedure when an image *is* warranted

1. Confirm the talk path: `apps/site/src/talks/<slug>/assets/` (React
   decks) or `meetups/<meetup>/<talk>/assets/` (legacy HTML). Create the
   directory if needed.
2. Search, then **pick for meaning**. Reject the pretty-but-generic hit
   (developer-at-laptop, handshake, mountain). Prefer the specific
   artifact the spoken sentence names.
3. Download **into local assets**. The deck must run offline on a
   projector. Remote URLs are not a runtime dependency.
4. Record photographer, source, license, page URL, retrieval date in
   `src/assets/ATTRIBUTION.md` **and** a sidecar
   `<filename>.attribution.md`.
5. Use `SlideImage` from `@talks/slide-engine`:

   ```tsx
   import { Slide, SlideImage, SpeakerNote } from "@talks/slide-engine";
   import shippingBox from "../assets/shipping-box.jpg";

   <SlideImage
     src={shippingBox}
     alt="Unmarked cardboard box on a concrete doorstep"
     caption="If this never leaves the warehouse, you refund."
   />
   ```

   `alt` describes the picture. `caption` states the claim.

6. Import the file. Do not use `https://images.unsplash.com/...` (or any
   CDN) as `src`.

## Fetch helper

```sh
node .agents/skills/slide-images/scripts/fetch-image.mjs \
  --query "punched card" \
  --out apps/site/src/talks/<slug>/assets \
  --source wikimedia
```

- `--source wikimedia` (default) — no API key. Preferred fallback.
- `--source unsplash` — requires `UNSPLASH_ACCESS_KEY`. Never invent a
  successful Unsplash response if the key is missing or the API errors.
- `--source pexels` — requires `PEXELS_API_KEY`. Same honesty rule.
- `--url <https://...>` — direct public download (Unsplash page download,
  Wikimedia original file, NASA, etc.). Still writes attribution.

The script prints the saved path and the attribution block on stdout.
If Unsplash/Pexels cannot run, it exits non-zero and tells you to use
`--source wikimedia` or `--url`. Do not fake success.

Secrets: read keys from the environment. Never commit them. Never print
the key.

## After the file lands

- Add or update the slide to import it.
- Append the attribution block to `ATTRIBUTION.md` if the script did not
  (it should have).
- Check the image at deck size: it must read from the back row. Crop
  rather than shrink a busy photo.

## Do not

- Do not hotlink Unsplash, Pexels, Wikimedia, or `source.unsplash.com`.
- Do not use AI-generated "stock" of real people as if they were photos.
- Do not put a logo watermark or the Unsplash URL on the slide itself;
  attribution lives in `ATTRIBUTION.md` and, when the license requires
  it on the work (CC BY / BY-SA), in the `caption`.
- Do not fetch "abstract technology background" to sit behind text.
