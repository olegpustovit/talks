import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { SpeakerNote } from "./SpeakerNote";
import { LoopMark } from "./components/LoopMark";
import { Tag } from "./components/Tag";

export type SlideLayout = "statement" | "wide" | "title";

export interface SlideProps {
  title: string;
  /** Keep the title for the outline, tab title, and screen readers, but don't draw it. */
  hideTitle?: boolean;
  kicker?: string;
  /** `statement` (default): giant title, narrow body. `wide`: compact title so a diagram or code excerpt can be the argument. `title`: Swiss poster — flush top-left, stacked display type, body fills the rest. */
  layout?: SlideLayout;
  className?: string;
  children?: ReactNode;
}

// Marker components that render outside the normal .slide-body flow.
const HOISTED_TYPES = new Set<unknown>([SpeakerNote, LoopMark]);

export function Slide({ title, hideTitle, kicker, layout = "statement", className, children }: SlideProps) {
  const all = Children.toArray(children);
  const body = all.filter((child) => !(isValidElement(child) && HOISTED_TYPES.has(child.type)));
  const mark = all.find((child) => isValidElement(child) && child.type === LoopMark);
  const wide = layout === "wide";
  const titlePage = layout === "title";
  return (
    <section
      className={[
        "relative flex h-full w-full max-w-[1200px] flex-col overflow-hidden",
        titlePage ? "justify-start" : "justify-center",
        titlePage ? "gap-8" : wide ? "gap-4" : "gap-6",
        "mx-auto px-[clamp(1.75rem,5cqw,4.5rem)]",
        titlePage
          ? "py-[clamp(2rem,6cqh,4.25rem)]"
          : wide
            ? "py-[clamp(1.25rem,3.5cqw,3rem)]"
            : "py-[clamp(1.75rem,5cqw,4.5rem)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-title={title}
    >
      {kicker && (
        <p
          className={
            titlePage
              ? "absolute top-[clamp(2rem,6cqh,4.25rem)] right-[clamp(1.75rem,5cqw,4.5rem)] z-10 m-0 font-bold tracking-tighter text-muted"
              : "relative z-10 m-0"
          }
        >
          {titlePage ? kicker : <Tag accent>{kicker}</Tag>}
        </p>
      )}
      <h1
        className={[
          titlePage
            ? "relative z-10 m-0 max-w-[8ch] text-[clamp(4.25rem,11cqw,8.75rem)] leading-[0.82] font-bold tracking-tighter"
            : wide
              ? "relative z-10 m-0 max-w-[28ch] text-[clamp(1.7rem,4cqw,3.1rem)] leading-[0.95] font-bold tracking-tighter"
              : "relative z-10 m-0 max-w-[18ch] text-[clamp(3rem,9cqw,7.5rem)] leading-[0.86] font-bold tracking-tighter",
          hideTitle ? "sr-only" : "",
          "text-balance",
        ].join(" ")}
      >
        {title}
      </h1>
      <div
        className={[
          "relative z-10 flex flex-col",
          titlePage
            ? "min-h-0 w-full flex-1 max-w-none gap-0"
            : wide
              ? "w-full max-w-none gap-4"
              : "max-w-[60ch] gap-[1.1rem]",
          "text-[clamp(1.05rem,2cqw,1.4rem)] leading-relaxed font-normal",
          "[&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-tighter",
          "[&_h3]:font-bold [&_h3]:leading-tight [&_h3]:tracking-tighter",
          "[&_ul]:pl-5 [&_ol]:pl-5",
          "[&_a]:text-fg [&_a]:underline [&_a]:decoration-accent [&_a]:decoration-2",
        ].join(" ")}
      >
        {body}
      </div>
      {mark}
    </section>
  );
}

// <Deck>'s children are per-slide wrapper components (<TitleSlide />, ...),
// not <Slide> elements directly — that's the whole point of "one component
// per slide" (see AGENTS.md). So the element Deck hands to getSlideTitle/
// getSpeakerNote is the *wrapper's* element, whose props are whatever was
// passed to the wrapper (usually none) — not the <Slide title=... kicker=...>
// it renders. Resolve that indirection by invoking the wrapper directly,
// outside React's own render cycle, to reach the <Slide> it returns. This
// is safe only because the convention keeps these wrappers hookless: they
// just compose JSX and return a single <Slide>, so calling them as plain
// functions has no side effects React would otherwise need to manage.
function resolveSlideElement(node: ReactNode): ReactElement<SlideProps> | null {
  if (!isValidElement(node)) return null;
  if (node.type === Slide) return node as ReactElement<SlideProps>;
  if (typeof node.type === "function") {
    const rendered = (node.type as (props: unknown) => ReactNode)(node.props);
    return resolveSlideElement(rendered);
  }
  return null;
}

export function getSlideTitle(slide: ReactNode): string {
  const resolved = resolveSlideElement(slide);
  return resolved && typeof resolved.props.title === "string" ? resolved.props.title : "";
}

export function getSpeakerNote(slide: ReactNode): ReactNode {
  const resolved = resolveSlideElement(slide);
  if (!resolved) return null;
  const note = Children.toArray(resolved.props.children).find(
    (child) => isValidElement(child) && child.type === SpeakerNote,
  );
  return note ?? null;
}
