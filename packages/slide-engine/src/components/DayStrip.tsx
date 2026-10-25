import { motion } from "motion/react";
import { Tag } from "./Tag";

export type DayMark = {
  at: string;
  label: string;
  mail?: string;
};

export function DayStrip({ days, current }: { days: DayMark[]; current: number; }) {
  return (
    <div className="flex w-full items-start">
      {days.map((day, i) => {
        const on = i <= current;
        const now = i === current;
        return (
          <div key={day.at} className="flex min-w-0 flex-1 flex-col gap-2 pr-3 last:pr-0">
            <div className="flex items-center">
              <motion.div
                className={now ? "h-3.5 w-3.5 bg-accent" : on ? "h-3.5 w-3.5 bg-fg" : "h-3.5 w-3.5 bg-fg/20"}
                animate={{ scale: now ? 1.25 : 1 }}
                transition={{ duration: 0.25 }}
              />
              {i < days.length - 1 && <div className={["h-[3px] min-w-0 flex-1", i < current ? "bg-fg" : "bg-border"].join(" ")} />}
            </div>
            <Tag accent={now}>{day.at}</Tag>
            <p className="m-0 font-bold leading-tight tracking-tighter">{day.label}</p>
            {day.mail && i <= current && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="m-0 text-[0.9rem] text-muted"
              >
                {day.mail}
              </motion.p>
            )}
          </div>
        );
      })}
    </div>
  );
}
