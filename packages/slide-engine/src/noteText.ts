import { Children, isValidElement, type ReactNode } from "react";

/** `cue` is a bold timing header, `direction` an italic stage direction — the conventions SpeakerNotesPanel styles. */
export type NoteParagraph = { kind: "cue" | "direction" | "text"; text: string };

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** A slide's planned window in the talk, in seconds from the start. */
export type NotePlan = { start: number; end: number };

function clockSeconds(clock: string): number {
  const [m, s] = clock.split(":").map(Number);
  return (m ?? 0) * 60 + (s ?? 0);
}

/** Reads the planned window from a note's bold cue line, e.g. "12 Title / 16:00–19:30 / 3:30". */
export function notePlan(note: ReactNode): NotePlan | null {
  const cue = noteParagraphs(note).find((paragraph) => paragraph.kind === "cue")?.text;
  const span = cue?.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return span ? { start: clockSeconds(span[1]!), end: clockSeconds(span[2]!) } : null;
}

/** Flattens a <SpeakerNote> element into plain paragraphs, so a phone remote can render it without the deck's components. */
export function noteParagraphs(note: ReactNode): NoteParagraph[] {
  if (!isValidElement<{ children?: ReactNode }>(note)) return [];
  return Children.toArray(note.props.children).flatMap((child) => {
    const text = textOf(child).replace(/\s+/g, " ").trim();
    if (!text) return [];
    const className = isValidElement<{ className?: string }>(child) ? (child.props.className ?? "") : "";
    const kind: NoteParagraph["kind"] = className.includes("font-bold") ? "cue" : className.includes("italic") ? "direction" : "text";
    return [{ kind, text }];
  });
}
