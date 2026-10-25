import { AnimatePresence, motion } from "motion/react";
import { useSlideStep } from "../Deck";
import { CodeEditor, type CodeLanguage } from "./CodeEditor";

export interface RevealCodeProps {
  /** Progressive snapshots of the same snippet, first to final. */
  stages: string[];
  language?: CodeLanguage;
  filename?: string;
}

/**
 * Builds a code snippet up stage by stage as the presenter narrates it.
 * Each press of next (arrow/Space) reveals the next stage on this slide
 * before the deck moves on to the next slide; Shift+S skips straight past
 * whatever's left. Read-only — this is a walkthrough, not a live editor
 * (see LiveCode for editable, runnable snippets).
 */
export function RevealCode({ stages, language = "javascript", filename }: RevealCodeProps) {
  const step = useSlideStep(Math.max(stages.length - 1, 0));
  const stage = stages[Math.min(step, stages.length - 1)] ?? "";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <CodeEditor code={stage} language={language} editable={false} filename={filename} />
      </motion.div>
    </AnimatePresence>
  );
}
