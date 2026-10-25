import { motion } from "motion/react";

export interface ProgressBarProps {
  index: number;
  count: number;
  activeStep: number;
  /** Registered substep totals per slide index (see useSlideStep). */
  stepTotals: number[];
}

// Every slide contributes (its substeps + 1) stops; progress is the
// current stop over the total number of stops across the whole deck, so a
// slide with substeps advances the bar gradually instead of jumping.
export function ProgressBar({ index, count, activeStep, stepTotals }: ProgressBarProps) {
  let currentStop = activeStep;
  let totalStops = 0;
  for (let i = 0; i < count; i++) {
    const stops = (stepTotals[i] ?? 0) + 1;
    if (i < index) currentStop += stops;
    totalStops += stops;
  }
  const percent = totalStops > 1 ? (currentStop / (totalStops - 1)) * 100 : 100;

  return (
    <div className="fixed top-0 left-0 z-10 h-2 w-full" aria-hidden="true">
      <motion.div
        className="h-full bg-accent"
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      />
    </div>
  );
}
