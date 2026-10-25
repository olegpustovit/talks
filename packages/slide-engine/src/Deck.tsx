import { Children, createContext, useContext, useEffect, useMemo, useCallback, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ThemeProvider, defaultTheme, type SlideTheme } from "./theme";
import { useDeckNavigation, type DeckNavigation } from "./useDeckNavigation";
import { useRemoteControl, type DeckState } from "./useRemoteControl";
import { notePlan } from "./noteText";
import { useStageScale, type StageSize } from "./useStageScale";
import { SlideCounter } from "./SlideCounter";
import { ProgressBar } from "./ProgressBar";
import { SpeakerNotesPanel } from "./SpeakerNotesPanel";
import { SlideOutlinePanel } from "./SlideOutlinePanel";
import { getSlideTitle, getSpeakerNote } from "./Slide";

// The design resolution every slide is authored against. Slide content
// measures itself in cqw/cqh against this fixed-px stage (see Slide.tsx and
// friends), not the browser's actual vw/vh, so the same deck lays out
// identically on a laptop, a 4:3 room projector, or a fullscreen 1080p
// output — only the uniform scale-to-fit factor changes, never the layout.
export const DEFAULT_CANVAS: StageSize = { width: 1280, height: 720 };

const DeckContext = createContext<DeckNavigation | null>(null);
const SlideIndexContext = createContext(0);

export function useDeck(): DeckNavigation {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDeck() must be called inside a <Deck>");
  return ctx;
}

/** The position (0-based) of the enclosing <Slide> among its siblings in <Deck>. */
export function useSlideIndex(): number {
  return useContext(SlideIndexContext);
}

/**
 * Registers `total` substeps for the enclosing slide and returns how many
 * are currently revealed (0..total). The deck's next()/prev() reveal one
 * substep at a time before moving slides; Shift+S skips straight past them.
 */
export function useSlideStep(total: number): number {
  const deck = useDeck();
  const slideIndex = useSlideIndex();
  useEffect(() => {
    deck.registerStepTotal(slideIndex, total);
  }, [deck, slideIndex, total]);
  return slideIndex === deck.index ? Math.min(deck.activeStep, total) : total;
}

/** True while this slide is the one on screen. Safe to use in child demos. */
export function useSlideIsActive(): boolean {
  return useDeck().index === useSlideIndex();
}

/** Drive a stepped demo from arrow keys. One owner per slide. */
export function useFrames<T>(frames: T[]): { step: number; frame: T } {
  const step = useSlideStep(Math.max(frames.length - 1, 0));
  const frame = frames[Math.min(step, frames.length - 1)] as T;
  return { step, frame };
}

export interface DeckProps {
  title: string;
  theme?: SlideTheme;
  /** Fixed design resolution slides are scaled to fit. Default 1280×720 (16:9). */
  canvas?: StageSize;
  children: ReactNode;
}

// All slides stay mounted (not just the active one) so their useSlideStep
// registrations are known up front — the progress bar and the "does this
// slide have more substeps" checks in useDeckNavigation depend on that.
// Framer Motion animates between them by opacity/position, not mount/unmount.
export function Deck({ title, theme = defaultTheme, canvas = DEFAULT_CANVAS, children }: DeckProps) {
  const slides = Children.toArray(children) as ReactElement[];
  const nav = useDeckNavigation(slides.length);
  const activeSlide = slides[nav.index];
  const reduceMotion = useReducedMotion();
  const slideTitles = useMemo(() => slides.map((slide) => getSlideTitle(slide)), [slides]);
  const { containerRef, scale } = useStageScale(canvas);
  const stageStyle: CSSProperties = {
    width: canvas.width,
    height: canvas.height,
    transform: `translate(-50%, -50%) scale(${scale})`,
    // Establishes the query container every cqw/cqh unit in Slide.tsx and
    // its descendants resolves against — always this fixed canvas size,
    // never the real (and per-projector unpredictable) viewport.
    containerType: "size",
    // An inset ring (never clipped, even when the stage exactly fills the
    // screen) so the true 1280×720 edge reads as a frame against the
    // letterbox, not a layout mistake.
    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.16)",
  };

  // Phones compare this against their own clock to time the current slide.
  const [slideStartedAt, setSlideStartedAt] = useState(() => Date.now());
  useEffect(() => setSlideStartedAt(Date.now()), [nav.index]);
  const note = getSpeakerNote(activeSlide);
  const remoteState: DeckState = {
    talk: title,
    index: nav.index,
    count: slides.length,
    title: slideTitles[nav.index] ?? "",
    next: slideTitles[nav.index + 1] ?? "",
    step: nav.activeStep,
    steps: nav.stepTotals[nav.index] ?? 0,
    slideStartedAt,
    plan: notePlan(note),
  };
  useRemoteControl({ next: nav.next, prev: nav.prev }, remoteState);

  useEffect(() => {
    const slideTitle = getSlideTitle(activeSlide);
    document.title = slideTitle ? `${title} — ${slideTitle}` : title;
  }, [activeSlide, title]);

  const selectSlide = useCallback(
    (index: number) => {
      nav.goTo(index);
      nav.toggleOutline();
    },
    [nav],
  );

  return (
    <ThemeProvider theme={theme}>
      <DeckContext.Provider value={nav}>
        <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black">
          <div className="absolute top-1/2 left-1/2 overflow-hidden bg-bg" style={stageStyle}>
            <div className="relative h-full w-full">
              {slides.map((slide, i) => {
                const isActive = i === nav.index;
                return (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : reduceMotion ? 0 : 8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    aria-hidden={!isActive}
                  >
                    <SlideIndexContext.Provider value={i}>{slide}</SlideIndexContext.Provider>
                  </motion.div>
                );
              })}
            </div>
            <SlideCounter index={nav.index} count={slides.length} />
            <ProgressBar
              index={nav.index}
              count={slides.length}
              activeStep={nav.activeStep}
              stepTotals={nav.stepTotals}
            />
          </div>
          <SpeakerNotesPanel visible={nav.notesVisible} note={note} />
          <SlideOutlinePanel visible={nav.outlineVisible} titles={slideTitles} activeIndex={nav.index} onSelect={selectSlide} />
        </div>
      </DeckContext.Provider>
    </ThemeProvider>
  );
}
