import { useEffect, useMemo, useState, type ReactNode } from "react";
import CodeMirror, { Decoration, EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { RangeSetBuilder, type Extension } from "@codemirror/state";

export type CodeLanguage = "javascript" | "jsx" | "html" | "css" | "json" | "python" | "text";

function extensionFor(language: CodeLanguage): Extension[] {
  switch (language) {
    case "javascript":
      return [javascript({ jsx: false })];
    case "jsx":
      return [javascript({ jsx: true })];
    case "html":
      return [html()];
    case "css":
      return [css()];
    case "json":
      return [json()];
    case "python":
      return [python()];
    default:
      return [];
  }
}

const LINE_ON = Decoration.line({ class: "se-line-on" });
const LINE_OFF = Decoration.line({ class: "se-line-off" });

function spotlight(lines: number[]): Extension[] {
  if (lines.length === 0) return [];
  const on = new Set(lines);
  return [
    EditorView.decorations.of((view) => {
      const builder = new RangeSetBuilder<Decoration>();
      for (let n = 1; n <= view.state.doc.lines; n++) {
        const from = view.state.doc.line(n).from;
        builder.add(from, from, on.has(n) ? LINE_ON : LINE_OFF);
      }
      return builder.finish();
    }),
  ];
}

export interface CodeEditorProps {
  code: string;
  language?: CodeLanguage;
  editable?: boolean;
  wrapLines?: boolean;
  filename?: string;
  /** 1-based lines to spotlight; every other line dims. */
  highlightLines?: number[];
  size?: "md" | "sm";
  onChange?: (value: string) => void;
  footer?: ReactNode;
}

export function CodeEditor({
  code,
  language = "javascript",
  editable = true,
  wrapLines = false,
  filename,
  highlightLines,
  size = "md",
  onChange,
  footer,
}: CodeEditorProps) {
  const [value, setValue] = useState(code);

  // Only relevant when the code isn't locally edited: lets a read-only
  // caller (e.g. RevealCode swapping between progressive stages) drive the
  // displayed content by changing the `code` prop.
  useEffect(() => {
    setValue(code);
  }, [code]);

  const spotlightKey = highlightLines?.join(",") ?? "";
  const extensions = useMemo(
    () => [
      ...extensionFor(language),
      ...(wrapLines ? [EditorView.lineWrapping] : []),
      ...spotlight(spotlightKey ? spotlightKey.split(",").map(Number) : []),
    ],
    [language, wrapLines, spotlightKey],
  );

  return (
    <div
      className={[
        "overflow-hidden border-border bg-surface font-mono [&_.cm-editor]:font-mono",
        size === "sm" ? "[&_.cm-editor]:text-[0.82rem]" : "[&_.cm-editor]:text-[0.95rem]",
        "[&_.cm-line]:transition-[opacity,background-color] [&_.cm-line]:duration-300",
        "[&_.se-line-on]:bg-accent/15 [&_.se-line-on]:shadow-[inset_4px_0_0_var(--color-accent)] [&_.se-line-off]:opacity-70",
      ].join(" ")}
      style={{ borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" }}
    >
      {filename && (
        <div
          className="border-border px-3 py-1.5 text-[0.8rem] font-bold text-muted"
          style={{ borderBottomWidth: "var(--se-border-width)" }}
        >
          {filename}
        </div>
      )}
      <CodeMirror
        value={value}
        height="auto"
        theme="light"
        editable={editable}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: editable }}
        extensions={extensions}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
      {footer && (
        <div className="border-border px-3 py-2" style={{ borderTopWidth: "var(--se-border-width)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
