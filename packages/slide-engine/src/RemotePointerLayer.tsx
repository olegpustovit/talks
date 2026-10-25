import { useEffect, useRef, useState } from "react";
import type { RemotePointer } from "./useRemoteControl";

/**
 * Click whatever sits under (x, y) on the stage, as if the mouse were there. Inside an iframe we
 * can't reach the page, so it gets a postMessage {type: "se-click", x, y} in its own pixels;
 * a page that wants remote clicks listens for it.
 */
export function clickStageAt(stage: HTMLElement, x: number, y: number) {
  const r = stage.getBoundingClientRect();
  const cx = r.left + x * r.width;
  const cy = r.top + y * r.height;
  const el = document.elementFromPoint(cx, cy);
  if (!el) return;
  if (el instanceof HTMLIFrameElement) {
    const ir = el.getBoundingClientRect();
    const s = ir.width / (el.offsetWidth || ir.width);
    el.contentWindow?.postMessage({ type: "se-click", x: (cx - ir.left) / s, y: (cy - ir.top) / s }, "*");
    return;
  }
  const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window };
  el.dispatchEvent(new PointerEvent("pointerdown", opts));
  el.dispatchEvent(new MouseEvent("mousedown", opts));
  el.dispatchEvent(new PointerEvent("pointerup", opts));
  el.dispatchEvent(new MouseEvent("mouseup", opts));
  el.dispatchEvent(new MouseEvent("click", opts));
}

/** Scroll whatever is scrollable under (x, y) by dx/dy stage pixels; iframes get a postMessage. */
export function scrollStageAt(stage: HTMLElement, x: number, y: number, dx: number, dy: number) {
  const r = stage.getBoundingClientRect();
  const s = r.width / (stage.offsetWidth || r.width);
  const cx = r.left + x * r.width;
  const cy = r.top + y * r.height;
  let el = document.elementFromPoint(cx, cy) as HTMLElement | null;
  if (el instanceof HTMLIFrameElement) {
    const ir = el.getBoundingClientRect();
    el.contentWindow?.postMessage({ type: "se-scroll", x: (cx - ir.left) / s, y: (cy - ir.top) / s, dx, dy }, "*");
    return;
  }
  while (el && el !== stage) {
    const st = getComputedStyle(el);
    if (/(auto|scroll)/.test(st.overflowY + st.overflowX) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
      el.scrollBy({ left: dx, top: dy });
      return;
    }
    el = el.parentElement;
  }
}

/**
 * The phone's trackpad pointer, drawn on the stage. Network updates arrive unevenly, so the
 * drawn pointer eases toward the latest position every frame: smooth, with no visible lag.
 * It fades out after a few idle seconds.
 */
export function RemotePointerLayer({ pointer }: { pointer: (RemotePointer & { at: number }) | null }) {
  const [visible, setVisible] = useState(false);
  const [ripple, setRipple] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const el = useRef<HTMLDivElement>(null);
  const pos = useRef<{ x: number; y: number } | null>(null);
  const target = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!pointer) return;
    if (pointer.hide) { setVisible(false); return; }
    target.current = { x: pointer.x, y: pointer.y };
    if (!pos.current) pos.current = { ...target.current };
    setVisible(true);
    if (pointer.click) {
      pos.current = { ...target.current };
      setRipple((n) => n + 1);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer.current);
  }, [pointer]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = pos.current, t = target.current;
      if (p && el.current) {
        p.x += (t.x - p.x) * 0.45;
        p.y += (t.y - p.y) * 0.45;
        el.current.style.left = `${p.x * 100}%`;
        el.current.style.top = `${p.y * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!pointer) return null;
  return (
    <div
      ref={el}
      aria-hidden="true"
      style={{ position: "absolute", zIndex: 50, pointerEvents: "none", opacity: visible ? 1 : 0, transition: "opacity .3s" }}
    >
      {ripple > 0 && (
        <span key={ripple} style={{
          position: "absolute", left: -18, top: -18, width: 36, height: 36, border: "2px solid var(--color-accent)",
          animation: "se-pointer-ripple .5s ease-out forwards",
        }} />
      )}
      <svg width="26" height="30" viewBox="0 0 26 30" style={{ display: "block", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))" }}>
        <path d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26 L12 16.5 L20 16.5 Z" fill="var(--color-fg)" stroke="var(--color-bg)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <style>{"@keyframes se-pointer-ripple{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}"}</style>
    </div>
  );
}
