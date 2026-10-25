#!/usr/bin/env node
// Fetch a public image into a talk's local assets and write attribution.
// Default source is Wikimedia Commons (no API key). Unsplash / Pexels
// require env keys and must fail honestly when they are missing.

import { createWriteStream } from "node:fs";
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

export const USER_AGENT = "talks-slide-images/1.0 (local talk deck assets; educational)";
export const APP_NAME = "talks-slide-images";

const IMAGE_MIMES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
]);

export function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value) {
  const slug = String(value || "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "image";
}

export function extensionForMime(mime, fallbackUrl = "") {
  if (mime && IMAGE_MIMES.has(mime)) return IMAGE_MIMES.get(mime);
  const fromUrl = extname(new URL(fallbackUrl, "https://example.invalid").pathname).toLowerCase();
  if (fromUrl && [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(fromUrl)) {
    return fromUrl === ".jpeg" ? ".jpg" : fromUrl;
  }
  return ".jpg";
}

export function formatAttribution({
  title,
  photographer,
  source,
  license,
  page,
  file,
  retrieved = new Date().toISOString().slice(0, 10),
}) {
  const lines = [
    `File: ${file || "(unsaved)"}`,
    `Title: ${title || "(untitled)"}`,
    `Photographer: ${photographer || "(unknown)"}`,
    `Source: ${source || "(unknown)"}`,
    `License: ${license || "(unknown)"}`,
    `Page: ${page || "(none)"}`,
    `Retrieved: ${retrieved}`,
  ];
  return lines.join("\n") + "\n";
}

export function parseArgs(argv) {
  const out = {
    query: "",
    url: "",
    outDir: "",
    source: "wikimedia",
    filename: "",
    photographer: "",
    page: "",
    license: "",
    title: "",
    index: 0,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      return argv[i];
    };
    switch (arg) {
      case "--query":
        out.query = next() || "";
        break;
      case "--url":
        out.url = next() || "";
        break;
      case "--out":
        out.outDir = next() || "";
        break;
      case "--source":
        out.source = (next() || "wikimedia").toLowerCase();
        break;
      case "--filename":
        out.filename = next() || "";
        break;
      case "--photographer":
        out.photographer = next() || "";
        break;
      case "--page":
        out.page = next() || "";
        break;
      case "--license":
        out.license = next() || "";
        break;
      case "--title":
        out.title = next() || "";
        break;
      case "--index":
        out.index = Number(next() || 0);
        break;
      case "--help":
      case "-h":
        out.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown flag: ${arg}`);
        }
    }
  }
  return out;
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

export async function searchWikimedia(query, index = 0) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrsearch", query);
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "8");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size|extmetadata");
  api.searchParams.set("iiurlwidth", "1920");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");

  const data = await fetchJson(api);
  const pages = Object.values(data?.query?.pages || {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const usable = pages.filter((page) => {
    const info = page.imageinfo?.[0];
    return info && IMAGE_MIMES.has(info.mime);
  });
  const chosen = usable[index] || usable[0];
  if (!chosen) {
    throw new Error(`No Wikimedia image results for ${JSON.stringify(query)}`);
  }
  const info = chosen.imageinfo[0];
  const meta = info.extmetadata || {};
  const license = stripHtml(meta.LicenseShortName?.value || meta.UsageTerms?.value || "see file page");
  const artist = stripHtml(meta.Artist?.value || meta.Credit?.value || "Wikimedia contributor");
  const downloadUrl = info.thumburl || info.url;
  return {
    title: stripHtml(chosen.title || "").replace(/^File:/, ""),
    photographer: artist,
    source: "Wikimedia Commons",
    license,
    page: `https://commons.wikimedia.org/wiki/${encodeURI(chosen.title)}`,
    url: downloadUrl,
    mime: info.mime,
  };
}

export async function searchUnsplash(query, index = 0, accessKey = process.env.UNSPLASH_ACCESS_KEY) {
  if (!accessKey) {
    throw new Error(
      "UNSPLASH_ACCESS_KEY is not set. Use --source wikimedia or --url with a file downloaded from unsplash.com.",
    );
  }
  const api = new URL("https://api.unsplash.com/search/photos");
  api.searchParams.set("query", query);
  api.searchParams.set("per_page", "8");
  const data = await fetchJson(api, { Authorization: `Client-ID ${accessKey}` });
  const results = data.results || [];
  const photo = results[index] || results[0];
  if (!photo) {
    throw new Error(`No Unsplash results for ${JSON.stringify(query)}`);
  }
  if (photo.links?.download_location) {
    try {
      await fetchJson(photo.links.download_location, { Authorization: `Client-ID ${accessKey}` });
    } catch {
      // Tracking ping is required by the API when possible; a failure to
      // ping must not invent a successful search. The photo itself may still
      // be downloaded if urls.regular is present.
    }
  }
  const url = photo.urls?.regular || photo.urls?.full || photo.urls?.raw;
  if (!url) {
    throw new Error("Unsplash result had no downloadable URL");
  }
  return {
    title: photo.alt_description || photo.description || query,
    photographer: photo.user?.name || photo.user?.username || "Unsplash photographer",
    source: "Unsplash",
    license: "Unsplash License",
    page: `${photo.user?.links?.html || "https://unsplash.com"}?utm_source=${APP_NAME}&utm_medium=referral`,
    url,
    mime: "image/jpeg",
  };
}

export async function searchPexels(query, index = 0, apiKey = process.env.PEXELS_API_KEY) {
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not set. Use --source wikimedia or --url.");
  }
  const api = new URL("https://api.pexels.com/v1/search");
  api.searchParams.set("query", query);
  api.searchParams.set("per_page", "8");
  const data = await fetchJson(api, { Authorization: apiKey });
  const photos = data.photos || [];
  const photo = photos[index] || photos[0];
  if (!photo) {
    throw new Error(`No Pexels results for ${JSON.stringify(query)}`);
  }
  const url = photo.src?.large2x || photo.src?.large || photo.src?.original;
  if (!url) {
    throw new Error("Pexels result had no downloadable URL");
  }
  return {
    title: photo.alt || query,
    photographer: photo.photographer || "Pexels photographer",
    source: "Pexels",
    license: "Pexels License",
    page: photo.url || "https://www.pexels.com",
    url,
    mime: "image/jpeg",
  };
}

export async function downloadToFile(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Download failed HTTP ${res.status} for ${url}`);
  }
  if (!res.body) {
    throw new Error(`Download had empty body for ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}

function writeAttributionFiles(outDir, filename, block) {
  const sidecar = join(outDir, `${filename}.attribution.md`);
  writeFileSync(sidecar, block);
  const ledger = join(outDir, "ATTRIBUTION.md");
  const header = existsSync(ledger) ? "\n" : "# Image attribution\n\n";
  appendFileSync(ledger, `${header}## ${filename}\n\n${block}`);
  return sidecar;
}

export async function fetchImage(opts) {
  const source = (opts.source || "wikimedia").toLowerCase();
  if (!opts.outDir) {
    throw new Error("--out <dir> is required");
  }
  if (!opts.url && !opts.query) {
    throw new Error("Provide --query <text> or --url <https://...>");
  }

  let chosen;
  if (opts.url) {
    chosen = {
      title: opts.title || basename(new URL(opts.url).pathname),
      photographer: opts.photographer || "(supplied URL)",
      source: opts.source && opts.source !== "wikimedia" ? opts.source : "direct URL",
      license: opts.license || "(see page)",
      page: opts.page || opts.url,
      url: opts.url,
      mime: "",
    };
  } else if (source === "unsplash") {
    chosen = await searchUnsplash(opts.query, opts.index || 0);
  } else if (source === "pexels") {
    chosen = await searchPexels(opts.query, opts.index || 0);
  } else if (source === "wikimedia") {
    chosen = await searchWikimedia(opts.query, opts.index || 0);
  } else {
    throw new Error(`Unknown --source ${source}. Use wikimedia, unsplash, pexels, or --url.`);
  }

  mkdirSync(opts.outDir, { recursive: true });
  const ext = extensionForMime(chosen.mime, chosen.url);
  const base = opts.filename
    ? opts.filename.replace(/\.[^.]+$/, "")
    : slugify(opts.query || chosen.title || "image");
  const filename = `${base}${ext}`;
  const destPath = join(opts.outDir, filename);
  await downloadToFile(chosen.url, destPath);
  const block = formatAttribution({
    title: chosen.title,
    photographer: chosen.photographer,
    source: chosen.source,
    license: chosen.license,
    page: chosen.page,
    file: filename,
  });
  const sidecar = writeAttributionFiles(opts.outDir, filename, block);
  return { destPath, sidecar, attribution: block, filename, chosen };
}

function printHelp() {
  process.stdout.write(`Fetch a public image into a talk's local assets.

Usage:
  fetch-image.mjs --query "punched card" --out DIR [--source wikimedia|unsplash|pexels]
  fetch-image.mjs --url URL --out DIR [--photographer NAME] [--page URL] [--license TEXT]

Default --source is wikimedia (no key). Unsplash needs UNSPLASH_ACCESS_KEY.
Pexels needs PEXELS_API_KEY. Missing keys fail honestly — they do not
invent a successful API response.
`);
}

async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) {
    printHelp();
    return 0;
  }
  const result = await fetchImage(opts);
  process.stdout.write(`Saved ${result.destPath}\n`);
  process.stdout.write(result.attribution);
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`${err.message || err}\n`);
      process.exit(1);
    },
  );
}
