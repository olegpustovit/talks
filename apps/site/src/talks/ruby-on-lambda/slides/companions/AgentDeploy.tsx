import { C, Code, StageScene, Text, col, colSpan, ease, phase, useStepTween } from "./shared";
import { DEPLOY_SKILL } from "./code";

// One loop, about sixteen seconds. An agent follows the deploy skill on the left, types AWS CLI
// commands in the terminal, and a numbered tracking box jumps to whatever each command touches:
// the account, the build, the function's versions and its live alias, CloudFront.
export const AGENT_H = 423;
const P = 16;
const SKILL = { x: col(0), y: 0, w: colSpan(4), size: 12.5, lh: 19 };
const TERM = { x: col(4), y: 168, w: 1152 - col(4), lh: 18 };
const STRIP_Y = 26;
const NODE_H = 96;

type Ev = { at: number; kind: "cmd" | "out" | "say"; text: string; step: number };
const EVENTS: Ev[] = [
  { at: 0.3, kind: "cmd", step: 1, text: "aws sts get-caller-identity --query Account --output text" },
  { at: 1.3, kind: "out", step: 1, text: "123456789012" },
  { at: 1.9, kind: "cmd", step: 2, text: 'docker run --rm -v "$PWD":/var/task public.ecr.aws/sam/build-ruby3.4 bundle install' },
  { at: 3.1, kind: "out", step: 2, text: "Bundle complete! 9 Gemfile dependencies, 23 gems now installed." },
  { at: 3.5, kind: "cmd", step: 2, text: "zip -qr build.zip . -x 'test/*'" },
  { at: 4.3, kind: "cmd", step: 3, text: "aws lambda update-function-code --function-name orders --zip-file fileb://build.zip" },
  { at: 5.4, kind: "cmd", step: 3, text: "aws lambda wait function-updated --function-name orders" },
  { at: 6.5, kind: "cmd", step: 4, text: "aws lambda publish-version --function-name orders --query Version --output text" },
  { at: 7.4, kind: "out", step: 4, text: "42" },
  { at: 7.8, kind: "cmd", step: 4, text: "aws lambda update-alias --function-name orders --name live --function-version 42" },
  { at: 9.1, kind: "cmd", step: 5, text: "curl -fsS https://orders.example.com/up" },
  { at: 9.8, kind: "out", step: 5, text: "ok" },
  { at: 10.4, kind: "cmd", step: 6, text: "aws cloudfront create-invalidation --distribution-id E2QWRUHAPOMQZL --paths '/assets/*'" },
  { at: 11.4, kind: "out", step: 6, text: '"Status": "InProgress"' },
  { at: 12.2, kind: "say", step: 6, text: "Deployed orders version 42 to live. To roll back, point live at 41." },
];
const TYPE_RATE = 95; // characters per second

// Resource nodes along the top; each skill step points at one of them.
const NODES = [
  { key: "account", x: col(4), w: 128, title: "AWS account", sub: "checked first" },
  { key: "build", x: col(4) + 150, w: 128, title: "build.zip", mono: true, sub: "gems built for Linux" },
  { key: "fn", x: col(4) + 300, w: 300, title: "orders", mono: true, sub: "function versions" },
  { key: "cdn", x: col(4) + 622, w: 1152 - col(4) - 622, title: "CloudFront", sub: "/assets/* invalidated" },
];
const STEP_NODE = [0, 0, 1, 2, 2, 2, 3];

export function AgentDeploy({ t }: { t: number }) {
  const tt = t % P;
  const fade = Math.min(phase(tt, 0, 0.4), 1 - phase(tt, P - 0.6, P));
  const seen = EVENTS.filter((e) => e.at <= tt);
  const step = seen.length ? seen[seen.length - 1]!.step : 0;
  const has42 = tt >= 7.4;
  const alias = ease(phase(tt, 8.0, 8.7));
  const smoke = tt >= 9.8;

  // Terminal lines: commands type out, outputs appear whole. The newest twelve stay on screen.
  const lines = seen.map((e) => ({ ...e, shown: e.kind === "cmd" ? e.text.slice(0, Math.floor((tt - e.at) * TYPE_RATE)) : e.text }));
  const visible = lines.slice(-11);

  const node = NODES[STEP_NODE[step]!]!;
  // Inside the function node, steps 3–5 lock onto different parts: the code, the versions, the alias.
  const target = step === 3 ? { x: node.x + 10, w: 120 } : step === 4 ? { x: node.x + 150, w: 140 } : step === 5 ? { x: node.x + 150, w: 140 } : { x: node.x, w: node.w };
  // The box glides from resource to resource, timed from the moment the step began.
  const stepStart = EVENTS.find((e) => e.step === step)?.at ?? 0;
  const [bx, bw] = useStepTween([target.x, target.w], step, (tt - stepStart) * 2) as [number, number];
  const box = { x: bx, w: bw };

  return (
    <StageScene h={AGENT_H} label="An agent follows a deploy skill: it checks the AWS account, builds gems for Linux, uploads the zip, publishes version 42, points the live alias at it, runs a smoke test and invalidates CloudFront. A tracking box jumps to each resource as the AWS CLI command that touches it is typed.">
      <g opacity={fade}>
        <Code {...SKILL} title=".claude/skills/deploy/SKILL.md" lines={DEPLOY_SKILL} lang="text" size={SKILL.size} lineH={SKILL.lh} focus={(i) => (step > 0 && i === 3 + step ? 1 : 0)} />
        <g>
          <Text x={SKILL.x} y={292} size={14} color={C.fg}>The recipe is reviewed like code.</Text>
          <Text x={SKILL.x} y={313} size={14} color={C.muted}>Every command lands in the log.</Text>
          <Text x={SKILL.x} y={346} size={14} color={C.coral}>No state file: the skill reads</Text>
          <Text x={SKILL.x} y={365} size={14} color={C.coral}>before it writes, and never deletes.</Text>
        </g>

        {/* Resources. */}
        <Text x={col(4)} y={12} size={13}>what the commands touch</Text>
        {NODES.map((n, i) => {
          const on = STEP_NODE[step] === i && step > 0;
          return (
            <g key={n.key}>
              <rect x={n.x} y={STRIP_Y} width={n.w} height={NODE_H} fill={C.surface} stroke={on ? C.fg : C.border} />
              <Text x={n.x + 12} y={STRIP_Y + 22} size={14} color={C.fg} mono={n.mono}>{n.title}</Text>
              {n.key !== "fn" && <Text x={n.x + 12} y={STRIP_Y + 42} size={12}>{n.sub}</Text>}
            </g>
          );
        })}
        <Versions x={NODES[2]!.x} has42={has42} alias={alias} smoke={smoke} t={t} />

        {/* The tracking box: numbered with the skill step, gliding between resources. */}
        {step > 0 && (
          <g>
            <rect x={box.x - 5} y={STRIP_Y - 5} width={box.w + 10} height={NODE_H + 10} fill="none" stroke={C.accent} />
            <rect x={box.x - 5} y={STRIP_Y - 21} width={18} height={16} fill={C.accent} />
            <Text x={box.x + 4} y={STRIP_Y - 9} anchor="middle" size={11} color={C.bg}>{String(step)}</Text>
            <path d={`M ${box.x + box.w / 2} ${STRIP_Y + NODE_H + 5} V ${TERM.y}`} fill="none" stroke={C.accent} strokeOpacity={0.5} />
          </g>
        )}

        {/* The terminal. */}
        <rect x={TERM.x} y={TERM.y} width={TERM.w} height={AGENT_H - TERM.y} fill={C.surface} stroke={C.border} />
        <line x1={TERM.x} x2={TERM.x + TERM.w} y1={TERM.y + 22} y2={TERM.y + 22} stroke={C.border} />
        <Text x={TERM.x + 12} y={TERM.y + 15} size={12}>agent session, following the deploy skill</Text>
        {visible.map((l, i) => {
          const y = TERM.y + 40 + i * TERM.lh;
          if (l.kind === "say") return <Text key={i} x={TERM.x + 14} y={y} size={13} color={C.accent}>{l.text}</Text>;
          const typing = l.kind === "cmd" && l.shown.length < l.text.length;
          return (
            <text key={i} x={TERM.x + 14} y={y} fontSize={12} className="ruby-mono" xmlSpace="preserve" style={{ whiteSpace: "pre" }}>
              {l.kind === "cmd" && <tspan fill={C.accent}>{"$ "}</tspan>}
              <tspan fill={l.kind === "cmd" ? C.fg : C.muted}>{l.shown}</tspan>
              {typing && <tspan fill={C.fg}>{"▌"}</tspan>}
            </text>
          );
        })}
      </g>
    </StageScene>
  );
}

/** Versions as squares, and the live alias that moves between them: rollback is moving it back. */
function Versions({ x, has42, alias, smoke, t }: { x: number; has42: boolean; alias: number; smoke: boolean; t: number }) {
  const vs = [39, 40, 41, 42];
  const vx = (i: number) => x + 150 + i * 36;
  const liveX = vx(2) + (vx(3) - vx(2)) * alias;
  return (
    <g>
      <rect x={x + 10} y={STRIP_Y + 34} width={120} height={48} fill="none" stroke={C.border} strokeDasharray="2 4" />
      <Text x={x + 20} y={STRIP_Y + 54} size={12} mono>$LATEST</Text>
      <Text x={x + 20} y={STRIP_Y + 72} size={12}>the uploaded code</Text>
      {vs.map((v, i) => {
        const shown = v < 42 || has42;
        const isNew = v === 42;
        return (
          <g key={v} opacity={shown ? 1 : 0.15}>
            <rect x={vx(i)} y={STRIP_Y + 52} width={28} height={28} fill={isNew && shown ? C.accent : C.surface} fillOpacity={isNew && shown ? 0.25 : 1} stroke={isNew && shown ? C.accent : C.border} />
            <Text x={vx(i) + 14} y={STRIP_Y + 71} anchor="middle" size={12} color={C.fg}>{String(v)}</Text>
          </g>
        );
      })}
      <g transform={`translate(${liveX} 0)`}>
        <rect x={-2} y={STRIP_Y + 28} width={32} height={16} fill={C.fg} />
        <Text x={14} y={STRIP_Y + 40} anchor="middle" size={11} color={C.bg}>live</Text>
        <path d={`M 14 ${STRIP_Y + 44} V ${STRIP_Y + 52}`} stroke={C.fg} />
      </g>
      {smoke && <Text x={vx(3) + 36} y={STRIP_Y + 71} size={12} color={C.accent} opacity={0.6 + 0.4 * Math.sin(t * 4)}>/up ok</Text>}
    </g>
  );
}
