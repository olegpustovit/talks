import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ThemeProvider } from "@talks/slide-engine";
import { talkTheme } from "../talks/ruby-on-lambda/theme";
import "../talks/ruby-on-lambda/talk.css";
import { SCENES } from "./scenes";
import { Timeline, META } from "./Timeline";
import { DeckReel } from "./DeckReel";

const q = new URLSearchParams(location.search);

/** One frame of the reel is a pure function of the frame number; Playwright steps it and screenshots. */
export function Reel() {
  if (q.get("deck")) return <DeckReel />;
  const [frame, setFrame] = useState(Number(q.get("f") ?? 0));
  useEffect(() => {
    (window as unknown as { __frame: (n: number) => void }).__frame = (n) => flushSync(() => setFrame(n));
    (window as unknown as { __meta: unknown }).__meta = META;
    document.fonts.ready.then(() => ((window as unknown as { __ready: boolean }).__ready = true));
  }, []);
  const gallery = q.get("scene");
  return (
    <ThemeProvider theme={talkTheme}>
      <style>{`*{transition:none!important;animation-play-state:paused!important} html,body{margin:0;background:#080a0b;overflow:hidden} .reel-scene .ruby-scene{width:100%;height:auto}`}</style>
      <div style={{ width: 1920, height: 1080, position: "relative", overflow: "hidden", background: "#080a0b" }}>
        {gallery ? (
          <div className="reel-scene" style={{ width: 1920 }}>
            {SCENES[gallery]!({ t: Number(q.get("t") ?? 3), step: Number(q.get("step") ?? 0), since: Number(q.get("since") ?? 3) })}
          </div>
        ) : (
          <Timeline frame={frame} />
        )}
      </div>
    </ThemeProvider>
  );
}
