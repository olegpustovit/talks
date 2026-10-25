import { RevealCode, Slide, SpeakerNote } from "@talks/slide-engine";

const STAGES = [
  `function fibonacci(n) {
  // ...
}`,
  `function fibonacci(n) {
  if (n < 2) return n;
}`,
  `function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  `function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

fibonacci(10); // 55`,
];

export function RevealCodeDemoSlide() {
  return (
    <Slide title="Build it up, live" kicker="Interactive">
      <p>
        Press → or Space to reveal this snippet one piece at a time — same key as slide
        navigation, it just fills in the substeps first. Shift+S skips straight to the next slide.
      </p>
      <RevealCode stages={STAGES} filename="fibonacci.js" />
      <SpeakerNote>
        <p>
          Narrate each stage before advancing: the base case, then the recursive case, then a
          call site. Don't rush past a stage while still talking about it.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
