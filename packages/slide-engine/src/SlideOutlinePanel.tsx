import { AnimatePresence, motion } from "motion/react";
import { Tag } from "./components/Tag";

export interface SlideOutlinePanelProps {
  visible: boolean;
  titles: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SlideOutlinePanel({ visible, titles, activeIndex, onSelect }: SlideOutlinePanelProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="outline"
          data-outline-panel
          className="fixed top-0 left-0 z-20 h-screen w-full overflow-y-auto bg-fg px-[clamp(1.5rem,4cqw,2.5rem)] py-[clamp(1.5rem,4cqh,2.5rem)] text-bg sm:w-[22rem]"
          style={{ borderRightWidth: "var(--se-border-width)", borderRightColor: "var(--color-accent)", borderRightStyle: "solid" }}
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 420, damping: 40 }}
        >
          <p className="m-0 mb-5">
            <Tag accent>Slides</Tag>
          </p>
          <ol className="m-0 flex list-none flex-col gap-1 p-0">
            {titles.map((title, i) => {
              const isActive = i === activeIndex;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "flex w-full items-baseline gap-3 px-3 py-2 text-left text-[1rem] leading-snug transition-colors",
                      isActive ? "bg-bg/15 font-bold text-bg" : "text-bg/70 hover:bg-bg/10 hover:text-bg",
                    ].join(" ")}
                    style={{ borderRadius: "var(--se-radius)" }}
                  >
                    <span className="shrink-0 text-[0.85em] tabular-nums text-bg/50">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{title || "Untitled"}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
