import { Slide, SpeakerNote, SilkField } from "@talks/slide-engine";

// The bookend: the opening strands again, edge to edge, combed straight at both ends and
// billowing in the middle, above one word.
export function ClosingSlide() {
  return (
    <Slide title={"Thanks"} hideTitle layout="wide" className="ruby-slide ruby-slide-close">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-close">
        <div className="ruby-close-threads" aria-hidden="true"><SilkField intensity={0.55} turbulence={0.45} strands={320} shape="middle" /></div>
        <h2>Thanks.</h2>
        <p className="ruby-close-questions">Questions?</p>
      </div>
      <SpeakerNote>
        <p>{"That's it. If you take one thing: pick one small API, the webhook or the cron job nobody loves, and try it. Same Rack app, a Lambda, and measure the boot before and after."}</p>
        <p>{"Thanks. Questions?"}</p>
      </SpeakerNote>
    </Slide>
  );
}
