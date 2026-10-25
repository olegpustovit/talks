import type { CSSProperties } from "react";
import { Slide, SpeakerNote } from "@talks/slide-engine";

// Who's talking: a short "who I am" on the left with the links, four facts on the right,
// each marked with one of the deck's colours. Type only, on the grid.
const FACTS = [
  { label: "Where", text: "Exponential Ventures, a startup accelerator", color: "var(--se-diagram-coral)" },
  { label: "Who with", text: "Early-stage startups in AI and robotics", color: "var(--se-diagram-amber)" },
  { label: "What I do", text: "Try new tools and workflows so small teams ship faster. A lot of aggressive problem solving", color: "var(--se-diagram-cyan)" },
  { label: "AWS", text: "Community Builder, previously a Solutions Architect", color: "var(--se-diagram-lavender)" },
];
const LINKS = [
  { label: "Web", text: "olegpustovit.com", href: "https://olegpustovit.com" },
  { label: "LinkedIn", text: "in/opustovit", href: "https://www.linkedin.com/in/opustovit/" },
  { label: "X", text: "@olegpustovit", href: "https://x.com/olegpustovit" },
];

export function AboutSlide() {
  return (
    <Slide title={"Who I am"} hideTitle layout="wide" className="ruby-slide ruby-slide-about">
      <div className="ruby-meta"><span>Oleg Pustovit · rubyZG</span><span>22 October 2026</span></div>
      <div className="ruby-about">
        <div className="ruby-about-who">
          <p className="ruby-label">{"02 / Who I am"}</p>
          <h2>Oleg Pustovit</h2>
          <p className="ruby-about-lede">I build with early-stage teams, and most of my week is experiments: new tools, new workflows, anything that gets a product out the door sooner.</p>
          <ul className="ruby-about-links">
            {LINKS.map((l) => (
              <li key={l.label}>
                <span>{l.label}</span>
                <a href={l.href} target="_blank" rel="noopener noreferrer">{l.text}</a>
              </li>
            ))}
          </ul>
        </div>
        <dl className="ruby-about-facts">
          {FACTS.map((f) => (
            <div key={f.label} style={{ "--fact": f.color } as CSSProperties}>
              <dt>{f.label}</dt>
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
      </div>
      <SpeakerNote>
        <p>{"Quickly, who I am. I'm Oleg. I work at Exponential Ventures, a startup accelerator, mostly with early-stage teams in AI and robotics."}</p>
        <p>{"Most of my week is experiments: new tools, new workflows, anything that lets a small team ship faster, and a lot of aggressive problem solving in whatever language the problem needs. I'm an AWS Community Builder and I used to be a Solutions Architect, so I've seen these trade-offs from both sides. That's why this talk is about what actually works."}</p>
        <p>{"Links are on the slide if you want to find me later."}</p>
      </SpeakerNote>
    </Slide>
  );
}
