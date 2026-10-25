import { mergeTheme } from "@talks/slide-engine";

export const talkTheme = mergeTheme({
  name: "ruby-lambda",
  colors: {
    bg: "#080a0b", surface: "#111514", fg: "#eeefeb", muted: "#909795",
    accent: "#b5e3bc", accentFg: "#080a0b", border: "#252b2a",
  },
  diagramColors: { coral: "#ff796b", lavender: "#c1b4e8", cyan: "#8bcbd7", amber: "#e6cd8d" },
  fontFamily: "Geist, 'Helvetica Neue', Arial, sans-serif",
  monoFontFamily: "Pragmasevka, ui-monospace, Menlo, monospace",
  borderWidth: "1px",
  tokens: {
    // 1280×720 stage: 12 columns of 74px, 24px gutters, 64px side margins, 8px baseline.
    "grid-columns": "12",
    "grid-gutter": "24px",
    "grid-margin-x": "64px",
    "grid-margin-top": "32px",
    "grid-margin-bottom": "72px",
    "grid-baseline": "8px",
    // Major-third scale (×1.25) from 16px, rounded to the baseline where it matters.
    "text-display": "300 72px/0.98",
    "text-h1": "300 56px/1",
    "text-h2": "300 40px/1.05",
    "text-lead": "400 24px/1.25",
    "text-body": "400 20px/1.4",
    "text-small": "400 15px/1.45",
    "text-ui": "500 14px/1",
    "text-label": "400 13px/1.4",
    "tracking-tight": "-0.045em",
    "tracking-snug": "-0.015em",
    // Slide counter: a label, not a headline. Sits in the bottom margin on the right column line.
    "counter-current": "500 13px/1",
    "counter-total": "400 13px/1",
    "counter-tracking": "0",
    "counter-right": "64px",
    "counter-bottom": "30px",
  },
});
