import { LoopMark, Slide, SpeakerNote } from "@talks/slide-engine";

export function ClosingSlide() {
  return (
    <Slide title="Thanks" kicker="[Your name] — [handle / email]">
      <p>[Call to action, repo link, or one thing you want people to remember.]</p>
      <LoopMark />
      <SpeakerNote>
        <p>Leave this up during Q&amp;A.</p>
      </SpeakerNote>
    </Slide>
  );
}
