import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Tag } from "./Tag";

export interface ClickRevealProps {
  prompt?: ReactNode;
  children: ReactNode;
}

/** Click (or Enter/Space) to swap a prompt for its hidden content. */
export function ClickReveal({ prompt = "Click to reveal", children }: ClickRevealProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={[
        "inline-block border-border px-[1.2em] py-[1em]",
        revealed ? "cursor-default border-solid" : "cursor-pointer border-dashed",
      ].join(" ")}
      style={{ borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" }}
      role="button"
      tabIndex={0}
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed(true);
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {revealed ? (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        ) : (
          <motion.span
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Tag accent>{prompt}</Tag>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
