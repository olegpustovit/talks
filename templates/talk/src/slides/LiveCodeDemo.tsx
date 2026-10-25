import { LiveCode, Slide, SpeakerNote } from "@talks/slide-engine";

const SAMPLE = `function fibonacci(n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 8; i++) {
  console.log(i, fibonacci(i));
}`;

export function LiveCodeDemoSlide() {
  return (
    <Slide title="Live, editable code" kicker="Interactive">
      <p>Edit the snippet, then hit Run — it executes in a sandboxed iframe, not on the page.</p>
      <LiveCode code={SAMPLE} />
      <SpeakerNote>
        <p>Point out that console.log is captured and streamed back via postMessage.</p>
      </SpeakerNote>
    </Slide>
  );
}
