import type { ReactNode } from "react";

export interface SpeakerNoteProps {
  children: ReactNode;
}

/**
 * Marker component: content here is pulled out of the slide body by
 * <Deck> and rendered in the speaker-note panel instead (toggled with "N").
 */
export function SpeakerNote({ children }: SpeakerNoteProps) {
  return <>{children}</>;
}
