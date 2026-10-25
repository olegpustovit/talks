import { ClickReveal, Slide, SpeakerNote, Steps } from "@talks/slide-engine";

export function InteractiveDemoSlide() {
  return (
    <Slide title="Clickable, on your terms" kicker="Interactive">
      <div className="grid grid-cols-1 items-start gap-10 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[0.95rem] font-bold tracking-tighter text-muted">Step through a list</p>
          <Steps>
            <p>First point lands immediately.</p>
            <p>Click reveals the next one.</p>
            <p>Great for building an argument beat by beat.</p>
          </Steps>
        </div>
        <div>
          <p className="mb-2 text-[0.95rem] font-bold tracking-tighter text-muted">Reveal an answer</p>
          <ClickReveal prompt="Click to reveal the answer">
            <p>O(n) — each element is visited once.</p>
          </ClickReveal>
        </div>
      </div>
      <SpeakerNote>
        <p>Use Steps for narrative build-ups, ClickReveal for Q&amp;A-style payoffs.</p>
      </SpeakerNote>
    </Slide>
  );
}
