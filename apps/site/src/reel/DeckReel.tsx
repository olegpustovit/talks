import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { DeckPreviewProvider } from "@talks/slide-engine";
import { App } from "../talks/ruby-on-lambda/App";

/**
 * The real deck, shown as one fixed slide and step, with no keys, hash or panels. Playwright owns
 * the clock (page.clock) and calls __go(index, step) on a schedule, so every canvas, shader and
 * scene runs on virtual time and any frame can be reproduced.
 */
export function DeckReel() {
  const [at, setAt] = useState({ index: 0, step: 0 });
  useEffect(() => {
    const w = window as unknown as { __go: (i: number, s: number) => void; __ready: boolean };
    w.__go = (index, step) => flushSync(() => setAt({ index, step }));
    document.fonts.ready.then(() => (w.__ready = true));
  }, []);
  return (
    <DeckPreviewProvider value={at}>
      <div style={{ width: 1920, height: 1080, position: "relative", overflow: "hidden", background: "#000" }}>
        <style>{`.slide-engine-theme-root{width:100%;height:100%} html,body{margin:0;overflow:hidden} [style*='inset 0 0 0 2px']{box-shadow:none!important}`}</style>
        <App />
      </div>
    </DeckPreviewProvider>
  );
}
