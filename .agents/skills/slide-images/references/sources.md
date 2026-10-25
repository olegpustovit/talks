# Public image sources

Always download a file into the talk's `src/assets/`. Never make the
deck depend on a CDN at runtime.

## Wikimedia Commons (default, no key)

Search + metadata via the MediaWiki API (File namespace 6):

```
https://commons.wikimedia.org/w/api.php
  ?action=query
  &generator=search
  &gsrsearch=<query>
  &gsrnamespace=6
  &gsrlimit=5
  &prop=imageinfo
  &iiprop=url|mime|size|extmetadata
  &iiurlwidth=1920
  &format=json
```

Required `User-Agent`: the helper sends `talks-slide-images/1.0`.

Licenses are usually CC BY, CC BY-SA, or public domain. **Honor them.**
CC BY / BY-SA need author + license on or next to the work (caption)
and in `ATTRIBUTION.md`. Skip files whose `extmetadata` is missing a
license, or that are "fair use". Prefer `image/jpeg`, `image/png`,
`image/webp`, `image/svg+xml`. Skip video and PDF.

Download the `imageinfo[0].url` (or `thumburl` if you asked for a
width) onto disk. Do not hotlink `upload.wikimedia.org` from the slide.

## Unsplash

- **License (site download):** irrevocable, nonexclusive, worldwide;
  commercial use allowed; attribution appreciated, not required.
  Do not sell unaltered Unsplash photos as a competing stock service.
- **API:** different rules. Requires an Access Key
  (`UNSPLASH_ACCESS_KEY`). API guidelines ask apps that *display*
  Unsplash photos to hotlink `photo.urls.*`, attribute photographer +
  Unsplash (with `utm_source`), and hit `links.download_location` when
  the user chooses a photo.
- **This repo:** we are not an Unsplash browser. We search (if a key
  is present), then save a **local copy** so a conference deck works
  offline. We still attribute photographer + Unsplash in
  `ATTRIBUTION.md`, and we hit the download endpoint when using the
  API. We do **not** hotlink at runtime.

If `UNSPLASH_ACCESS_KEY` is unset or the API errors, **do not pretend
it worked**. Use Wikimedia or `--url` with a file the user downloaded
from unsplash.com (File → Download).

Search: `GET https://api.unsplash.com/search/photos?query=...`
Header: `Authorization: Client-ID $UNSPLASH_ACCESS_KEY`

## Pexels (optional second keyed source)

Same honesty rule as Unsplash. `PEXELS_API_KEY` from
https://www.pexels.com/api/. Attribution of photographer + Pexels is
required by their API terms. Local copy, not hotlink.

`GET https://api.pexels.com/v1/search?query=...`
Header: `Authorization: $PEXELS_API_KEY`

## Direct URL (`--url`)

Use when the speaker already has a public file URL: Wikimedia original,
NASA Image Library, Unsplash download, Smithsonian Open Access, etc.
Pass `--photographer`, `--page`, `--license` when the URL does not
carry them. The helper still writes the sidecar.

Do not pass a hotlink that is a tracking redirect. Prefer the
original-file URL.

## Other public-domain / open collections (manual)

- NASA Images / ESA — usually public domain; still caption the agency.
- Smithsonian Open Access — CC0; record the object number.
- NYPL Public Domain.
- US government works (check the specific agency).

These are fine with `--url` once you have the file URL and the credit
line. Do not scrape HTML galleries.

## What we will not use

- Random "AI stock" of a fictional person presented as photography.
- Unlicensed screenshots of someone else's slides or product UI as if
  they were ours (a screenshot of *the failure you caused in your own
  system* is fine).
- `source.unsplash.com` (deprecated) or lorem-picsum as talk content.
