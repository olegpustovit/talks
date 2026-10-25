import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Tag } from "./components/Tag";

export function SpeakerNotesPanel({ visible, note }: { visible: boolean; note: ReactNode }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="notes"
          data-speaker-panel
          className="fixed top-0 right-0 z-20 h-screen w-full overflow-y-auto bg-fg px-[clamp(1.5rem,4cqw,2.5rem)] py-[clamp(1.5rem,4cqh,2.5rem)] text-bg sm:w-[26rem]"
          style={{ borderLeftWidth: "var(--se-border-width)", borderLeftColor: "var(--color-accent)", borderLeftStyle: "solid" }}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 420, damping: 40 }}
        >
          <p className="m-0 mb-5">
            <Tag accent>Speaker notes</Tag>
          </p>
          <div
            className={[
              "flex flex-col gap-4 text-[1.05rem] leading-[1.6]",
              "[&>p]:m-0",
              "[&>p.font-bold]:text-[0.8rem] [&>p.font-bold]:leading-tight [&>p.font-bold]:tracking-tight [&>p.font-bold]:text-bg/60",
              "[&>p.italic]:text-[0.95rem] [&>p.italic]:text-bg/70",
            ].join(" ")}
          >
            {note ?? <p className="text-bg/60">No notes for this slide.</p>}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
