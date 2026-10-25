import { mergeTheme } from "@talks/slide-engine";

// Per-talk overrides. Swap the accent, surface, anything in SlideTheme —
// the base engine styles read everything through --se-* custom properties.
export const talkTheme = mergeTheme({
  colors: {
    accent: "#ff2d78",
  },
});
