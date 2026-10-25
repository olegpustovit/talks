import { LoopMark, Slide, SpeakerNote } from "@talks/slide-engine";

export function TitleSlide() {
  return (
    <Slide title="[Talk Title]" kicker="[Meetup] — [Date]">
      <p>[One-line hook that tells the room why this talk exists.]</p>
      <p className="mt-2 text-[0.95rem] font-bold tracking-tighter text-muted">
        Press → or Space to begin. Press N or S for the script.
      </p>
      <LoopMark />
      <SpeakerNote>
        <p>Open with the hook line above, then move straight into the problem slide.</p>
      </SpeakerNote>
    </Slide>
  );
}
