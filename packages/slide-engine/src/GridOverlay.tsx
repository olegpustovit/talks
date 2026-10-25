import { useTheme } from "./theme";
import "./GridOverlay.css";

/** Column grid drawn over the stage (G), from the theme's grid-* tokens. */
export function GridOverlay() {
  const theme = useTheme();
  const columns = Number(theme.tokens?.["grid-columns"] ?? 12);
  return (
    <div className="se-grid-overlay" aria-hidden="true">
      <div className="se-grid-overlay-cols">
        {Array.from({ length: columns }, (_, i) => <span key={i}>{i + 1}</span>)}
      </div>
    </div>
  );
}
