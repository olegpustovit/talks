import { AnimatePresence, motion } from "motion/react";
import { Children, useState, type ReactNode } from "react";
import { Button } from "./Button";

export interface StepsProps {
  children: ReactNode;
  nextLabel?: string;
}

/** Reveals its children one at a time on click, independent of slide navigation. */
export function Steps({ children, nextLabel = "Next point ▸" }: StepsProps) {
  const items = Children.toArray(children);
  const [step, setStep] = useState(Math.min(1, items.length));

  return (
    <div className="flex flex-col gap-3">
      <ol className="m-0 flex list-none flex-col gap-[0.6em] p-0">
        <AnimatePresence initial={false}>
          {items.slice(0, step).map((item, i) => (
            <motion.li
              key={i}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {item}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      {step < items.length && (
        <Button className="mt-2 self-start" onClick={() => setStep((s) => s + 1)}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
