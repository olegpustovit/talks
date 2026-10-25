import { Slide, SpeakerNote, SteppedScene } from "@talks/slide-engine";
import { Network } from "./companions/Network";

export function NeedsAComputerSlide() {
  return (
    <Slide title={"Every app needs a computer"} hideTitle layout="wide" className="ruby-slide ruby-slide-need">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-layout">
        <div className="ruby-words">
          <p className="ruby-label">{"03 / The problem"}</p>
          <h2>{"Every app needs a computer"}</h2>
          <p className="ruby-subtitle">{"And nobody gives you one for free.*"}</p>
          <p className="ruby-footnote">{"* Free tiers exist, with a catch: PaaS free instances sleep when idle, no-code builders host the server for you, and free VMs are usually one small shared CPU."}</p>
        </div>
        <SteppedScene cues={["The internet connects computers", "Your app needs one of its own"]} still={4}>
          {(t, step) => <Network t={t} step={step} />}
        </SteppedScene>
      </div>
      <SpeakerNote>
        <p>{"The internet was always about connecting computers. Every node in this picture is somebody's machine, and every app you build ends up needing one of them to run on."}</p>
        <p>{"Press once. There's your app, looking for a home. Nobody hands you a server. The free options all have a catch: a PaaS free tier that falls asleep, a no-code builder like Lovable or Replit that runs the server for you but never gives it to you, a free VM with one tiny CPU you now have to babysit."}</p>
        <p>{"Keep this short and a little frustrated. The next slide is the twist."}</p>
        <h3>Steps</h3>
        <ol>
          <li>{"The internet: computers connected to computers."}</li>
          <li>{"Your app needs one, and every free option has a catch."}</li>
        </ol>
      </SpeakerNote>
    </Slide>
  );
}
