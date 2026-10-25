import { Children, createContext, useContext, useEffect, useMemo, useCallback, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ThemeProvider, defaultTheme, type SlideTheme } from "./theme";
import { useDeckNavigation, type DeckNavigation, type DeckPreview } from "./useDeckNavigation";
import { useRemoteControl, type DeckState } from "./useRemoteControl";
import { notePlan } from "./noteText";
import { useStageScale, type StageSize } from "./useStageScale";
import { SlideCounter } from "./SlideCounter";
import { RemotePointerLayer, clickStageAt, scrollStageAt } from "./RemotePointerLayer";
import type { RemotePointer } from "./useRemoteControl";
import { ProgressBar } from "./ProgressBar";
import { SpeakerNotesPanel } from "./SpeakerNotesPanel";
import { SlideOutlinePanel } from "./SlideOutlinePanel";
import { DesignSystemPanel } from "./DesignSystemPanel";
import { GridOverlay } from "./GridOverlay";
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
  // registerStepTotal is stable; depending on the whole deck value would re-run this on every
  // deck render, and the cleanup's 0 followed by `total` would re-render the deck again, forever.
  const register = deck.registerStepTotal;
  useEffect(() => {
    register(slideIndex, total);
    // A slide that drops its stepped demo (or a hot reload that removes it) must not keep invisible steps.
    return () => register(slideIndex, 0);
  }, [register, slideIndex, total]);
  return slideIndex === deck.index ? Math.min(deck.activeStep, total) : total;
}

/** True while this slide is the one on screen. Safe to use in child demos. */
export function useSlideIsActive(): boolean {
  return useDeck().index === useSlideIndex();
}

/** Drive a stepped demo from arrow keys. One owner per slide. */
export function useFrames<T>(frames: T[]): { step: number; frame: T } {
  const step = useSlideStep(Math.max(frames.length - 1, 0));
  // String frames are step captions: publish them so a phone remote can say what's next.
  const register = useDeck().registerStepLabels;
  const slideIndex = useSlideIndex();
  const labels = frames.every((f) => typeof f === "string") ? (frames as string[]).join("\u0000") : "";
  useEffect(() => {
    if (labels) register(slideIndex, labels.split("\u0000"));
  }, [register, slideIndex, labels]);
  const frame = frames[Math.min(step, frames.length - 1)] as T;
  return { step, frame };
}

const DeckPreviewContext = createContext<DeckPreview | null>(null);
/**
 * Render any talk's <Deck> as a still-but-alive preview of one slide and step: no keyboard,
 * hash, remote connection, counter or panels, and it fills its parent instead of the window.
 */
export const DeckPreviewProvider = DeckPreviewContext.Provider;

export interface DeckProps {
  title: string;
  theme?: SlideTheme;
  /** Fixed design resolution slides are scaled to fit. Default 1280×720 (16:9). */
  canvas?: StageSize;
  /** Talk-specific specimens shown in the design-system sheet (D). */
  designSystem?: ReactNode;
  children: ReactNode;
}

// All slides stay mounted (not just the active one) so their useSlideStep
// registrations are known up front — the progress bar and the "does this
// slide have more substeps" checks in useDeckNavigation depend on that.
// Framer Motion animates between them by opacity/position, not mount/unmount.
export function Deck({ title, theme = defaultTheme, canvas = DEFAULT_CANVAS, designSystem, children }: DeckProps) {
  const slides = Children.toArray(children) as ReactElement[];
  const preview = useContext(DeckPreviewContext);
  const nav = useDeckNavigation(slides.length, preview);
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
    titles: slideTitles,
    stepLabels: nav.stepLabels[nav.index] ?? [],
  };
  const stageRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<(RemotePointer & { at: number }) | null>(null);
  useRemoteControl(
    {
      next: nav.next,
      prev: nav.prev,
      // Slide jumps skip the current slide's remaining steps.
      nextSlide: () => nav.goTo(nav.index + 1),
      prevSlide: () => nav.goTo(nav.index - 1),
      goTo: (index) => nav.goTo(index),
      pointer: (p) => {
        setPointer({ ...p, at: Date.now() });
        if (p.click && stageRef.current) clickStageAt(stageRef.current, p.x, p.y);
      },
      scroll: (s) => {
        if (stageRef.current) scrollStageAt(stageRef.current, s.x, s.y, s.dx, s.dy);
      },
    },
    remoteState,
    !preview,
  );

  useEffect(() => {
    const slideTitle = getSlideTitle(activeSlide);
    if (preview) return;
    document.title = slideTitle ? `${title} — ${slideTitle}` : title;
  }, [activeSlide, title, preview]);

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
        <div ref={containerRef} className={["relative overflow-hidden bg-black", preview ? "h-full w-full" : "h-screen w-screen"].join(" ")}>
          <div ref={stageRef} className="absolute top-1/2 left-1/2 overflow-hidden bg-bg" style={stageStyle}>
            <div className="relative h-full w-full">
              {slides.map((slide, i) => {
                const isActive = i === nav.index;
                // A full-bleed slide (an image edge to edge) doesn't slide in: the 8 px offset would show a strip.
                const flush = (slide.props as { fullBleed?: boolean }).fullBleed === true;
                return (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive || flush || reduceMotion ? 0 : 8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    aria-hidden={!isActive}
                  >
                    <SlideIndexContext.Provider value={i}>{slide}</SlideIndexContext.Provider>
                  </motion.div>
                );
              })}
            </div>
            {nav.gridVisible && <GridOverlay />}
            {!preview && (
              <>
                <SlideCounter index={nav.index} count={slides.length} />
                <RemotePointerLayer pointer={pointer} />
                <ProgressBar
                  index={nav.index}
                  count={slides.length}
                  activeStep={nav.activeStep}
                  stepTotals={nav.stepTotals}
                />
              </>
            )}
          </div>
          <SpeakerNotesPanel visible={nav.notesVisible} note={note} />
          <SlideOutlinePanel visible={nav.outlineVisible} titles={slideTitles} activeIndex={nav.index} onSelect={selectSlide} />
          {/* Specimens see the active slide's index, so animated ones run like they do on stage. */}
          <SlideIndexContext.Provider value={nav.index}>
            <DesignSystemPanel visible={nav.designVisible} onClose={nav.toggleDesign}>{designSystem}</DesignSystemPanel>
          </SlideIndexContext.Provider>
        </div>
      </DeckContext.Provider>
    </ThemeProvider>
  );
}
