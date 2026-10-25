import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";

export interface SlideTheme {
  name: string;
  colors: {
    bg: string;
    surface: string;
    fg: string;
    muted: string;
    accent: string;
    accentFg: string;
    border: string;
  };
  fontFamily: string;
  monoFontFamily: string;
  borderWidth: string;
  radius: string;
  /** Optional named colors for authored diagrams, exposed as --se-diagram-*. */
  diagramColors?: Record<string, string>;
}

/**
 * Grotesk-driven editorial identity: viewport-scale type, one loud accent
 * used as solid blocks (not text color), thick flat hard-edged borders, no
 * gradients/shadows, no rounded-everything. Labels are solid tag chips —
 * never uppercase text spread out with letter-spacing (see AGENTS.md, that
 * pattern is banned: it reads as generic corporate-deck design).
 *
 * Colors and fonts map onto Tailwind's own theme tokens (bg-accent,
 * font-sans, ...) via tailwind-theme.css's @theme block; ThemeProvider
 * overrides the actual values per-talk with inline custom properties.
 */
export const defaultTheme: SlideTheme = {
  name: "helvetica-editorial",
  colors: {
    bg: "#f4f2ec",
    surface: "#ffffff",
    fg: "#111111",
    muted: "#5c5c58",
    accent: "#ff3d1a",
    accentFg: "#ffffff",
    border: "#111111",
  },
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  monoFontFamily:
    "ui-monospace, 'SF Mono', 'Berkeley Mono', Menlo, Consolas, monospace",
  borderWidth: "3px",
  radius: "0px",
};

type ThemeOverrides = Partial<Omit<SlideTheme, "colors">> & {
  colors?: Partial<SlideTheme["colors"]>;
};

export function mergeTheme(overrides: ThemeOverrides): SlideTheme {
  return {
    ...defaultTheme,
    ...overrides,
    colors: { ...defaultTheme.colors, ...overrides.colors },
  };
}

const ThemeContext = createContext<SlideTheme>(defaultTheme);

export function useTheme(): SlideTheme {
  return useContext(ThemeContext);
}

function themeToCssVars(theme: SlideTheme): CSSProperties {
  return {
    "--color-bg": theme.colors.bg,
    "--color-surface": theme.colors.surface,
    "--color-fg": theme.colors.fg,
    "--color-muted": theme.colors.muted,
    "--color-accent": theme.colors.accent,
    "--color-accent-fg": theme.colors.accentFg,
    "--color-border": theme.colors.border,
    "--font-sans": theme.fontFamily,
    "--font-mono": theme.monoFontFamily,
    "--se-border-width": theme.borderWidth,
    "--se-radius": theme.radius,
    ...Object.fromEntries(
      Object.entries(theme.diagramColors ?? {}).map(([name, color]) => [`--se-diagram-${name}`, color]),
    ),
  } as CSSProperties;
}

export function ThemeProvider({
  theme = defaultTheme,
  children,
}: {
  theme?: SlideTheme;
  children: ReactNode;
}) {
  const style = useMemo(() => themeToCssVars(theme), [theme]);
  return (
    <div className="slide-engine-theme-root bg-bg font-sans text-fg" style={style}>
      {children}
    </div>
  );
}
