import { AppWindow, Email, Slide, SpeakerNote, Tag, useFrames } from "@talks/slide-engine";

const RULES = [
  "When someone signs up, they get 14 days free. No card.",
  "If they're still on the trial at day 2, send a reminder.",
  "If they're still on the trial at day 10, send a few tips so they get value.",
  "On day 14: if they paid, keep access. If not, end the trial.",
];

type Scene = "imagine" | "signup" | "reminder" | "tips" | "end";

const FRAMES: { scene: Scene; rules: number; caption: string }[] = [
  { scene: "imagine", rules: 0, caption: "Imagine a SaaS with a fourteen-day trial." },
  { scene: "signup", rules: 1, caption: "Someone signs up." },
  { scene: "reminder", rules: 2, caption: "Two days later, a reminder." },
  { scene: "tips", rules: 3, caption: "Day 10 — a few tips, so they get value." },
  { scene: "end", rules: 4, caption: "Day 14: paid, they stay. Unpaid, the trial ends." },
];

function Scene({ scene }: { scene: Scene }) {
  if (scene === "imagine") {
    return (
      <AppWindow product="Forge">
        <p className="m-0 text-[clamp(1.6rem,3cqw,2.3rem)] font-bold leading-[0.95] tracking-tighter">
          Design with your team.
        </p>
        <p className="m-0 text-muted">14 days free. No card yet.</p>
        <p className="m-0">
          <Tag accent>Start trial</Tag>
        </p>
      </AppWindow>
    );
  }
  if (scene === "signup") {
    return (
      <AppWindow product="Forge">
        <p className="m-0">
          <Tag accent>Trial · 14 days left</Tag>
        </p>
        <p className="m-0 text-[clamp(1.4rem,2.6cqw,1.9rem)] font-bold leading-[1.05] tracking-tighter">
          Welcome, Ada.
        </p>
        <p className="m-0 text-muted">Empty workspace. Clock is running.</p>
      </AppWindow>
    );
  }
  if (scene === "reminder") {
    return (
      <Email from="Forge" subject="You've used 2 of 14 days">
        <p className="m-0">Still time to invite the team. Most people who do, stick around.</p>
      </Email>
    );
  }
  if (scene === "tips") {
    return (
      <Email from="Forge" subject="Three things people do in week two">
        <p className="m-0">Share a file. Leave a comment. Invite one person who isn't you.</p>
      </Email>
    );
  }
  return (
    <AppWindow product="Forge">
      <p className="m-0">
        <Tag accent>Day 14</Tag>
      </p>
      <p className="m-0 text-[clamp(1.4rem,2.6cqw,1.9rem)] font-bold leading-[1.05] tracking-tighter">
        Subscribe, or this workspace closes.
      </p>
      <p className="m-0 text-muted">Paid: keep access. Unpaid: expire the trial.</p>
    </AppWindow>
  );
}

function Spec({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {RULES.slice(0, count).map((rule, i) => (
        <li key={rule} className="m-0 flex gap-3">
          <span className={i === count - 1 ? "font-bold tracking-tighter text-accent" : "font-bold tracking-tighter text-muted"}>
            {i + 1}
          </span>
          <p className="m-0 font-bold leading-snug tracking-tighter">{rule}</p>
        </li>
      ))}
    </ol>
  );
}

function TrialDemo() {
  const { frame } = useFrames(FRAMES);
  return (
    <div className="flex w-full flex-col gap-6">
      <p className="m-0 font-bold tracking-tighter">{frame.caption}</p>
      {frame.rules === 0 ? (
        <Scene scene={frame.scene} />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18ch,0.95fr)]">
          <Scene scene={frame.scene} />
          <Spec count={frame.rules} />
        </div>
      )}
    </div>
  );
}

export function TrialTimelineSlide() {
  return (
    <Slide title="A 14 day trial" layout="wide">
      <TrialDemo />
      <SpeakerNote>
        <p className="font-bold">02 A 14 day trial / 01:30–02:45 / 1:15</p>
        <p className="italic">
          → reveals: product, signup, reminder, tips, day 14. The list is the spec in English.
        </p>
        <p>
          Imagine we're building a SaaS product with a fourteen-day trial. When someone signs up,
          we want to send them a reminder after two days. After ten days, we send some tips to
          help them get value from the product. At day fourteen, we check their subscription. If
          they have paid, they keep access. Otherwise, we end their trial. A different product
          might send a final reminder instead, but we'll use trial expiry today so the example has
          a clear ending.
        </p>
        <p>
          The product requirement is easy to explain. A person who has never written Python can
          understand this. That's useful, because it gives us something to compare the
          implementation against.
        </p>
      </SpeakerNote>
    </Slide>
  );
}
