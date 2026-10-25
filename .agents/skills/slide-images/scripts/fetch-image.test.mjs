import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripHtml,
  slugify,
  extensionForMime,
  formatAttribution,
  parseArgs,
} from "./fetch-image.mjs";

describe("fetch-image helpers", () => {
  it("stripHtml removes tags and entities from Wikimedia artist fields", () => {
    assert.equal(
      stripHtml('<a href="https://commons.wikimedia.org/wiki/User:Jane">Jane&nbsp;Doe</a>'),
      "Jane Doe",
    );
  });

  it("slugify builds a filename stem from a query", () => {
    assert.equal(slugify("Punched Card (IBM)"), "punched-card-ibm");
    assert.equal(slugify(""), "image");
  });

  it("extensionForMime maps MIME and falls back to the URL path", () => {
    assert.equal(extensionForMime("image/png"), ".png");
    assert.equal(extensionForMime("", "https://upload.example/foo.JPEG"), ".jpg");
    assert.equal(extensionForMime("image/tiff", "https://upload.example/foo.tif"), ".jpg");
  });

  it("formatAttribution writes a ledger block the skill requires", () => {
    const block = formatAttribution({
      title: "The Blue Marble",
      photographer: "NASA",
      source: "Wikimedia Commons",
      license: "Public domain",
      page: "https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg",
      file: "blue-marble.jpg",
      retrieved: "2026-09-14",
    });
    assert.match(block, /^File: blue-marble\.jpg$/m);
    assert.match(block, /^Photographer: NASA$/m);
    assert.match(block, /^Source: Wikimedia Commons$/m);
    assert.match(block, /^License: Public domain$/m);
    assert.match(block, /^Retrieved: 2026-09-14$/m);
  });

  it("parseArgs reads query, out, source, and url", () => {
    const opts = parseArgs([
      "--query",
      "punched card",
      "--out",
      "/tmp/assets",
      "--source",
      "wikimedia",
    ]);
    assert.equal(opts.query, "punched card");
    assert.equal(opts.outDir, "/tmp/assets");
    assert.equal(opts.source, "wikimedia");

    const direct = parseArgs(["--url", "https://example.com/a.jpg", "--out", "assets"]);
    assert.equal(direct.url, "https://example.com/a.jpg");
    assert.equal(direct.source, "wikimedia");
  });
});
