import { Deck } from "@talks/slide-engine";
import { talkTheme } from "./theme";
import { TitleSlide } from "./slides/Title";
import { RevealCodeDemoSlide } from "./slides/RevealCodeDemo";
import { LiveCodeDemoSlide } from "./slides/LiveCodeDemo";
import { InteractiveDemoSlide } from "./slides/InteractiveDemo";
import { ImageDemoSlide } from "./slides/ImageDemo";
import { ClosingSlide } from "./slides/Closing";

export function App() {
  return (
    <Deck title="[Talk Title]" theme={talkTheme}>
      <TitleSlide />
      <RevealCodeDemoSlide />
      <LiveCodeDemoSlide />
      <InteractiveDemoSlide />
      <ImageDemoSlide />
      <ClosingSlide />
    </Deck>
  );
}
