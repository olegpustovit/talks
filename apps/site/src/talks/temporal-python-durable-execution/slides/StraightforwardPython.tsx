import { CodeEditor, Slide, SlideImage, SpeakerNote } from "@talks/slide-engine";
import infiniteComputer from "../assets/infinite-computer.jpg";

const CODE = `def trial(user_id):
    time.sleep(days=2)
    send_reminder(user_id)
    time.sleep(days=8)
    send_tips(user_id)
    time.sleep(days=4)
    expire_if_unpaid(user_id)`;

export function StraightforwardPythonSlide() {
  return (
    <Slide title="An infinitely reliable computer" layout="wide">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(16ch,0.95fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <CodeEditor code={CODE} language="python" editable={false} filename="trial.py" />
          <ul className="m-0 flex list-none flex-col gap-2 p-0 font-bold tracking-tighter">
            <li className="m-0">Never crashes.</li>
            <li className="m-0">Hardware that doesn't wear.</li>
            <li className="m-0">Infinite power.</li>
            <li className="m-0">Same process on day 14 as on day 0.</li>
          </ul>
        </div>
        <div className="[&_img]:max-h-[min(42cqh,22rem)] [&_img]:w-full [&_img]:object-cover">
          <SlideImage
            src={infiniteComputer}
            alt="A solitary black computer in an empty white room, one small light on"
            caption="The program only works if this never dies."
          />
        </div>
      </div>
      <SpeakerNote>
        <p className="font-bold">06 An infinitely reliable computer / 06:30–08:00 / 1:30</p>
        <p className="italic">The question is spoken, not on the slide.</p>
        <p>
          This program only works on a computer that never crashes. Hardware that doesn't wear
          out. An infinite source of power. The process on day fourteen has to be the same
          process that started on day zero. time.sleep does not survive a deploy.
        </p>
        <p>That computer doesn't exist.</p>
        <p>
          So the interesting question is not "how do we add more sweepers." It's: can we
          technically approximate this? Not the fantasy hardware — the essence. A function you
          can read. Waits that mean waits. The spec still looks like the spec.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
