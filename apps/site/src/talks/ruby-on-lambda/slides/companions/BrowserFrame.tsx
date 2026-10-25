import { useState } from "react";

// The live demo endpoint, written by `make deploy` in demo/spinel-lambda. Globbed so a missing
// file (nothing deployed yet) is an empty object instead of a build error.
const found = import.meta.glob<{ url: string; region?: string; function?: string; deployedAt?: string }>(
  "../../demo/spinel-lambda/endpoint.json",
  { eager: true, import: "default" },
);
export const ENDPOINT = Object.values(found)[0];

/** A browser window: a tab, an address bar with the real URL, reload and open, the page in an iframe. */
export function BrowserFrame({ url, title, live }: { url?: string; title: string; live: boolean }) {
  const [nonce, setNonce] = useState(0);
  const host = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  return (
    <div className="ruby-browser" data-live={Boolean(url && live)}>
      <div className="ruby-browser-tabs">
        <span className="ruby-browser-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="ruby-browser-tab">{title}</span>
        <span className="ruby-browser-live"><i aria-hidden="true" />{url ? "live from AWS Lambda" : "not deployed"}</span>
      </div>
      <div className="ruby-browser-bar">
        <span className="ruby-browser-url" title={url}>
          {url ? <><span className="ruby-browser-scheme">https://</span><span className="ruby-mono">{host}</span></> : "run make deploy in demo/spinel-lambda"}
        </span>
        <span className="ruby-browser-actions">
          <button type="button" onClick={() => setNonce((n) => n + 1)} disabled={!url} aria-label="Reload the page">Reload</button>
          {url && <a href={url} target="_blank" rel="noopener noreferrer">Open</a>}
        </span>
      </div>
      {url && live ? (
        <iframe key={nonce} src={`${url}${url.includes("?") ? "&" : "?"}r=${nonce}`} title={title} sandbox="allow-scripts" referrerPolicy="no-referrer" />
      ) : (
        <div className="ruby-browser-empty">{url ? "The page loads when this step is on screen." : "Deploy the demo, then reload the deck."}</div>
      )}
    </div>
  );
}
