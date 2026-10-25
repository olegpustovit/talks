import { useCallback, useEffect, useRef, useState } from "react";

export interface DeckNavigation {
  index: number;
  count: number;
  /** Current substep within the active slide (0 = nothing extra revealed yet). */
  activeStep: number;
  /** Registered substep totals per slide index, for progress calculations. */
  stepTotals: number[];
  notesVisible: boolean;
  outlineVisible: boolean;
  goTo: (index: number) => void;
  /** Jump to a specific reveal in the active slide. */
  goToStep: (step: number) => void;
  /** Reveal the next substep on this slide, or advance to the next slide once exhausted. */
  next: () => void;
  /** Reveal the previous substep, or go back a slide (fully revealed) once exhausted. */
  prev: () => void;
  /** Skip any remaining substeps and jump straight to the next slide (Shift+S). */
  forceNextSlide: () => void;
  toggleNotes: () => void;
  toggleOutline: () => void;
  /** A step-owning component (e.g. RevealCode) reports its total substep count here. */
  registerStepTotal: (slideIndex: number, total: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function indexFromHash(count: number): number {
  const parsed = Number.parseInt(window.location.hash.slice(1), 10);
  if (Number.isNaN(parsed)) return 0;
  return clamp(parsed - 1, 0, Math.max(count - 1, 0));
}

// A key event that lands inside an editable surface (an editable CodeMirror
// instance, an <input>, contentEditable) must never trigger slide
// navigation. isContentEditable reflects CodeMirror's actual editable state
// (it sets contentEditable="false" on its content DOM when read-only), so a
// read-only CodeEditor/RevealCode block never blocks nav — only an editable
// one (LiveCode, an editable CodeEditor) does.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return true;
  return target.isContentEditable;
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
}

export function useDeckNavigation(count: number): DeckNavigation {
  const [index, setIndexState] = useState(() => indexFromHash(count));
  const [activeStep, setActiveStep] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const [outlineVisible, setOutlineVisible] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const stepTotalsRef = useRef<number[]>([]);
  const [stepTotals, setStepTotals] = useState<number[]>([]);

  const registerStepTotal = useCallback((slideIndex: number, total: number) => {
    stepTotalsRef.current[slideIndex] = total;
    setStepTotals((prev) => {
      if (prev[slideIndex] === total) return prev;
      const next = [...prev];
      next[slideIndex] = total;
      return next;
    });
  }, []);

  // Moving forward always starts a slide unrevealed; moving backward re-enters
  // it fully revealed, then stepping back peels off one substep at a time.
  const goTo = useCallback(
    (target: number) => {
      const clamped = clamp(target, 0, Math.max(count - 1, 0));
      const current = indexRef.current;
      if (clamped !== current) {
        setActiveStep(clamped > current ? 0 : (stepTotalsRef.current[clamped] ?? 0));
      }
      setIndexState(clamped);
    },
    [count],
  );

  const next = useCallback(() => {
    const total = stepTotalsRef.current[indexRef.current] ?? 0;
    if (activeStep < total) {
      setActiveStep((s) => s + 1);
    } else {
      goTo(indexRef.current + 1);
    }
  }, [activeStep, goTo]);

  const prev = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    } else {
      goTo(indexRef.current - 1);
    }
  }, [activeStep, goTo]);

  const forceNextSlide = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const goToStep = useCallback((step: number) => {
    setActiveStep(clamp(step, 0, stepTotalsRef.current[indexRef.current] ?? 0));
  }, []);
  const toggleNotes = useCallback(() => setNotesVisible((v) => !v), []);
  const toggleOutline = useCallback(() => setOutlineVisible((v) => !v), []);

  useEffect(() => {
    window.location.hash = String(index + 1);
  }, [index]);

  useEffect(() => {
    function onHashChange() {
      goTo(indexFromHash(count));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [count, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      switch (event.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          prev();
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(count - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "n":
        case "N":
          setNotesVisible((v) => !v);
          break;
        case "s":
        case "S":
          event.preventDefault();
          if (event.shiftKey) {
            forceNextSlide();
          } else {
            setNotesVisible((v) => !v);
          }
          break;
        case "i":
        case "I":
          setOutlineVisible((v) => !v);
          break;
        case "Escape":
          setOutlineVisible(false);
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, forceNextSlide, goTo, next, prev]);

  useEffect(() => {
    let startX = 0;
    function onTouchStart(event: TouchEvent) {
      startX = event.touches[0]?.clientX ?? 0;
    }
    function onTouchEnd(event: TouchEvent) {
      const endX = event.changedTouches[0]?.clientX ?? startX;
      const delta = endX - startX;
      if (Math.abs(delta) < 50) return;
      if (delta < 0) next();
      else prev();
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev]);

  return {
    index,
    count,
    activeStep,
    stepTotals,
    notesVisible,
    outlineVisible,
    goTo,
    goToStep,
    next,
    prev,
    forceNextSlide,
    toggleNotes,
    toggleOutline,
    registerStepTotal,
  };
}
