import { mergeTheme } from "@talks/slide-engine";

export const talkTheme = mergeTheme({
  name: "ruby-lambda",
  colors: {
    bg: "#080a0b", surface: "#111514", fg: "#eeefeb", muted: "#909795",
    accent: "#b5e3bc", accentFg: "#080a0b", border: "#252b2a",
  },
  diagramColors: { coral: "#ff796b", lavender: "#c1b4e8", cyan: "#8bcbd7", amber: "#e6cd8d" },
  fontFamily: "AtlasSans, Arial, sans-serif",
  borderWidth: "1px",
});
