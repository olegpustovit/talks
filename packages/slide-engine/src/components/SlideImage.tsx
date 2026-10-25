import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export interface SlideImageProps {
  src: string;
  alt: string;
  caption?: string;
  zoomable?: boolean;
}

export function SlideImage({ src, alt, caption, zoomable = true }: SlideImageProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <figure className="m-0">
      <img
        src={src}
        alt={alt}
        onClick={zoomable ? () => setZoomed(true) : undefined}
        className={["block max-w-full border-border", zoomable ? "cursor-zoom-in" : ""].join(" ")}
        style={{ borderWidth: "var(--se-border-width)" }}
      />
      {caption && (
        <figcaption className="mt-2 text-[clamp(0.9rem,1.5cqw,1.05rem)] font-bold leading-snug tracking-tighter text-muted">
          {caption}
        </figcaption>
      )}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            className="fixed inset-0 z-30 flex cursor-zoom-out items-center justify-center bg-fg/92 p-[4cqw]"
            role="button"
            tabIndex={0}
            onClick={() => setZoomed(false)}
            onKeyDown={(e) => e.key === "Escape" && setZoomed(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <img src={src} alt={alt} className="max-h-full max-w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
}
