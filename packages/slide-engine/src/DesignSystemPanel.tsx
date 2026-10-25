import type { ReactNode } from "react";
import { useTheme } from "./theme";
import "./DesignSystemPanel.css";

export interface DesignSystemPanelProps {
  visible: boolean;
  onClose: () => void;
  /** The talk's own specimens: type scale and components, as <DesignSection>s. */
  children?: ReactNode;
}

const WEIGHTS = [300, 400, 500, 700];

/**
 * Full-screen sheet of the live theme (D). Tokens come straight from the
 * theme, so what you see here is what the slides use. A talk adds its type
 * scale and components through `<Deck designSystem={...}>`.
 */
export function DesignSystemPanel({ visible, onClose, children }: DesignSystemPanelProps) {
  const theme = useTheme();
  if (!visible) return null;
  const colors = [
    ...Object.entries(theme.colors).map(([name, value]) => ({ name, value, token: `--color-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}` })),
    ...Object.entries(theme.diagramColors ?? {}).map(([name, value]) => ({ name, value, token: `--se-diagram-${name}` })),
  ];
  return (
    <div className="se-ds" role="dialog" aria-label="Design system">
      <header className="se-ds-head">
        <div>
          <p className="se-ds-kicker">Design system</p>
          <h1>{theme.name}</h1>
        </div>
        <button type="button" onClick={onClose}>Close · D</button>
      </header>

      <DesignSection title="Color" note="Theme tokens. Change them in the talk's theme.ts.">
        <div className="se-ds-swatches">
          {colors.map((c) => (
            <figure key={c.token}>
              <div style={{ background: `var(${c.token})` }} />
              <figcaption>
                <strong>{c.name}</strong>
                <code>{c.token}</code>
                <code>{c.value}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </DesignSection>

      <DesignSection title="Type families" note="Weights the browser can't find are synthesized. Ship only the ones you use.">
        <div className="se-ds-families">
          <div>
            <code>--font-sans</code>
            {WEIGHTS.map((w) => (
              <p key={w} style={{ fontWeight: w }}>
                <span>{w}</span>Running Ruby apps on AWS Lambda
              </p>
            ))}
          </div>
          <div>
            <code>--font-mono</code>
            <p className="se-ds-mono"><span>400</span>{"run ->(env) { [200, {}, [\"ok\"]] }"}</p>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Shape" note="One border width, one radius. Radius 0 means every box is square.">
        <div className="se-ds-shape">
          <figure>
            <div style={{ borderWidth: "var(--se-border-width)" }} />
            <figcaption><code>--se-border-width</code><code>{theme.borderWidth}</code></figcaption>
          </figure>
          <figure>
            <div style={{ borderRadius: "var(--se-radius)" }} />
            <figcaption><code>--se-radius</code><code>{theme.radius}</code></figcaption>
          </figure>
        </div>
      </DesignSection>

      {theme.tokens && (
        <DesignSection title="Grid and type tokens" note="From theme.tokens, exposed as --se-*. Press G on any slide to see the grid.">
          <div className="se-ds-tokens">
            {Object.entries(theme.tokens).map(([name, value]) => (
              <div key={name}>
                <code>{`--se-${name}`}</code>
                <span>{value}</span>
                {name.startsWith("text-") && <p style={{ font: `var(--se-${name}) var(--font-sans)`, letterSpacing: name.match(/display|h1|h2/) ? "var(--se-tracking-tight)" : undefined }}>Boot time is now latency</p>}
              </div>
            ))}
          </div>
        </DesignSection>
      )}

      {children}
    </div>
  );
}

export function DesignSection({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="se-ds-section">
      <div className="se-ds-section-head">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

/** One named component or type role, with the rule for using it. */
export function DesignSpecimen({ name, rule, children, wide }: { name: string; rule?: string; children: ReactNode; wide?: boolean }) {
  return (
    <figure className={["se-ds-specimen", wide ? "se-ds-specimen-wide" : ""].join(" ")}>
      <div className="se-ds-specimen-stage">{children}</div>
      <figcaption>
        <strong>{name}</strong>
        {rule && <span>{rule}</span>}
      </figcaption>
    </figure>
  );
}
