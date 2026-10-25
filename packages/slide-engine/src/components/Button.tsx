import { motion } from "motion/react";
import type { ReactNode } from "react";

export interface ButtonProps {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export function Button({ onClick, className, children }: ButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={[
        "appearance-none border-border bg-surface px-[1.1em] py-[0.5em] font-sans text-[0.9rem]",
        "font-bold tracking-tighter text-fg transition-colors",
        "hover:border-accent hover:bg-accent hover:text-accent-fg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderWidth: "var(--se-border-width)", borderRadius: "var(--se-radius)" }}
    >
      {children}
    </motion.button>
  );
}
