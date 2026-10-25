import { memo } from "react";
import { C, Code, StageScene, Text, charW, col, colSpan, ease, hash, lineY, phase, useStepTween } from "./shared";
import { CDK_STACK, TF_PLAN } from "./code";

// Step 1: nine lines of CDK print a wall of synthesized CloudFormation; tracking boxes flag
// what nobody wrote, and the stack's states run until it sticks in UPDATE_ROLLBACK_FAILED.
// Step 2: the wall slides aside, the seven lines that matter fly out of it into a Terraform
// plan, and a dot matrix counts what each tool asks you to read.
const WALL = { y: 24, w: colSpan(4), h: 220 };
const COLS = 6;
const ROWS = 100;
const CW = (WALL.w - (COLS - 1) * 8) / COLS;
const RH = WALL.h / ROWS;

const FLAGS = [
  { c: 1, from: 20, to: 46, color: C.coral, label: "a Lambda function you didn't write" },
  { c: 2, from: 6, to: 20, color: C.amber, label: "a layer with the AWS CLI inside it" },
  { c: 3, from: 30, to: 72, color: C.lavender, label: "IAM roles and policies for both" },
  { c: 5, from: 4, to: 28, color: C.cyan, label: "parameters from the CDK bootstrap stack" },
];
// The seven template lines that correspond to the plan's seven lines: they fly out in step 2.
const PICKED = [{ c: 0, r: 12 }, { c: 0, r: 57 }, { c: 2, r: 33 }, { c: 3, r: 81 }, { c: 4, r: 45 }, { c: 4, r: 90 }, { c: 5, r: 66 }];
const PLAN_LINES = [0, 1, 2, 3, 4, 5, 7];

const indent = (c: number, r: number) => Math.floor(Math.abs(Math.sin(r * 0.23 + c * 1.7)) * 4) * 5;
const barW = (c: number, r: number) => Math.max(6, (0.25 + hash(c * 1000 + r) * 0.65) * (CW - indent(c, r)));
const barX = (c: number, r: number) => c * (CW + 8) + indent(c, r);
const barY = (r: number) => r * RH;

const STATES = ["UPDATE_IN_PROGRESS", "UPDATE_FAILED", "UPDATE_ROLLBACK_IN_PROGRESS", "UPDATE_ROLLBACK_FAILED"];
const PLAN = { x: col(4), y: 24, w: 470, size: 13, lh: 20 };

export function Tooling({ t, step, since }: { t: number; step: number; since: number }) {
  const [wallX, pCdk, pTf] = useStepTween(step === 0 ? [col(8), 1, 0] : [col(0), 0, 1], step, since) as [number, number, number];
  const printed = step === 0 ? ease(phase(since, 0.9, 2.3)) : 1;

  return (
    <StageScene label="Nine lines of CDK synthesize a wall of CloudFormation, several hundred lines, with a Lambda function, a layer and IAM policies nobody wrote; a failed update ends in UPDATE_ROLLBACK_FAILED. Then a Terraform plan: seven lines saying exactly what will change. A dot matrix compares the lines each asks you to read.">
      {/* The template, wherever it is. */}
      <g transform={`translate(${wallX} ${WALL.y})`}>
        <Text x={0} y={-10} size={13} color={C.muted}>{step === 0 ? "cdk synth: the template CloudFormation runs" : "what CDK asked you to review"}</Text>
        <clipPath id="ruby-wall-print"><rect x={-2} y={0} width={WALL.w + 4} height={WALL.h * printed} /></clipPath>
        <g clipPath="url(#ruby-wall-print)" opacity={step === 0 ? 1 : 0.55}><Wall /></g>
        <Flags t={t} on={pCdk * (step === 0 ? ease(phase(since, 2.5, 3.0)) : 1)} since={since} />
      </g>

      {pCdk > 0.01 && <CdkSide opacity={pCdk} t={t} since={step === 0 ? since : 0} />}
      {pTf > 0.01 && <TerraformSide opacity={pTf} since={step === 1 ? since : 9} wallX={wallX} />}
    </StageScene>
  );
}

const Wall = memo(function Wall() {
  const bars = [];
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      bars.push(<rect key={`${c}-${r}`} x={barX(c, r)} y={barY(r)} width={barW(c, r)} height={RH * 0.62} fill={C.fg} opacity={0.18 + hash(r * 7 + c) * 0.22} />);
  return <g>{bars}</g>;
});

/** Runs of the template nobody wrote, coloured, boxed and numbered. */
function Flags({ t, on, since }: { t: number; on: number; since: number }) {
  if (on <= 0) return null;
  return (
    <g>
      {FLAGS.map((f, k) => {
        const p = ease(phase(since, 2.5 + k * 0.25, 3.1 + k * 0.25)) * on;
        const x = f.c * (CW + 8) - 3 + Math.sin(t * 0.9 + k) * 1.5;
        const y = barY(f.from) - 3;
        const h = barY(f.to) - barY(f.from) + 6;
        return (
          <g key={k} opacity={on}>
            {Array.from({ length: f.to - f.from }, (_, i) => {
              const r = f.from + i;
              return <rect key={r} x={barX(f.c, r)} y={barY(r)} width={barW(f.c, r)} height={RH * 0.62} fill={f.color} opacity={0.85 * p} />;
            })}
            <rect x={x} y={y} width={CW + 6} height={h} fill="none" stroke={C.fg} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            <rect x={x} y={y - 15} width={16} height={15} fill={C.fg} opacity={p} />
            <Text x={x + 8} y={y - 4} anchor="middle" size={11} color={C.bg} opacity={p}>{String(k + 1)}</Text>
          </g>
        );
      })}
    </g>
  );
}

function CdkSide({ opacity, t, since }: { opacity: number; t: number; since: number }) {
  const x = col(4);
  const loopT = Math.max(0, since - 3.6) % 8;
  const lit = Math.min(STATES.length - 1, Math.floor(loopT / 1.1));
  const stuck = lit === STATES.length - 1;
  let cx = x;
  return (
    <g opacity={opacity}>
      <Code x={x} y={WALL.y} w={318} title="lib/orders-stack.ts" lines={CDK_STACK} lang="ts" size={12} lineH={18} />
      <Text x={x + 326} y={WALL.y + 102} size={12} mono color={C.fg}>cdk synth</Text>
      <path d={`M ${x + 326} ${WALL.y + 112} H ${col(8) - 10} M ${col(8) - 16} ${WALL.y + 108} L ${col(8) - 10} ${WALL.y + 112} L ${col(8) - 16} ${WALL.y + 116}`} fill="none" stroke={C.fg} strokeOpacity={0.6} />

      {FLAGS.map((f, k) => {
        const p = ease(phase(since, 2.6 + k * 0.25, 3.2 + k * 0.25));
        const y = WALL.y + 238 + k * 26;
        return (
          <g key={k} opacity={p}>
            <rect x={x} y={y - 13} width={16} height={15} fill={C.fg} />
            <Text x={x + 8} y={y - 2} anchor="middle" size={11} color={C.bg}>{String(k + 1)}</Text>
            <rect x={x + 26} y={y - 9} width={8} height={8} fill={f.color} />
            <Text x={x + 42} y={y} size={14} color={C.fg}>{f.label}</Text>
          </g>
        );
      })}

      {/* A failed update, and where CloudFormation leaves you. */}
      <g opacity={ease(phase(since, 3.4, 3.9))}>
        <Text x={x} y={378} size={13}>then an update fails halfway</Text>
        {STATES.map((s, i) => {
          const w = s.length * charW(12) + 20;
          const at = cx;
          cx += w + 26;
          const on = i <= lit;
          const bad = s.includes("FAILED");
          const color = bad ? C.coral : C.amber;
          const pulse = stuck && i === lit ? 0.5 + 0.5 * Math.sin(t * 5) : 1;
          return (
            <g key={s} opacity={on ? 1 : 0.25}>
              <rect x={at} y={390} width={w} height={28} fill={i === lit && bad ? C.coral : "none"} fillOpacity={0.18 * pulse} stroke={on ? color : C.border} />
              <Text x={at + 10} y={408} size={12} mono color={on ? color : C.muted}>{s}</Text>
              {i < STATES.length - 1 && <Text x={at + w + 8} y={408} size={13}>→</Text>}
            </g>
          );
        })}
        <g opacity={stuck ? 1 : 0}>
          <Text x={x} y={446} size={14} color={C.fg}>Stuck. Fix the resource by hand, then run</Text>
          <Text x={x + 268} y={446} size={13} mono color={C.coral}>continue-update-rollback</Text>
        </g>
      </g>
    </g>
  );
}

function TerraformSide({ opacity, since, wallX }: { opacity: number; since: number; wallX: number }) {
  const text = ease(phase(since, 1.7, 2.3));
  const factsX = col(9);
  return (
    <g opacity={opacity}>
      <Text x={PLAN.x} y={WALL.y - 10} size={13}>terraform plan: what will change, and nothing else</Text>
      <g opacity={text}>
        <Code x={PLAN.x} y={PLAN.y} w={PLAN.w} lines={TF_PLAN} lang="hcl" size={PLAN.size} lineH={PLAN.lh} focus={(i) => (i >= 2 && i <= 4 ? 1 : 0)} accent={C.amber} />
      </g>

      {/* Seven lines leave the wall and become the plan. */}
      {PICKED.map((b, i) => {
        const p = ease(phase(since, 0.8 + i * 0.09, 1.7 + i * 0.09));
        const line = TF_PLAN[PLAN_LINES[i]!]!;
        const fx = wallX + barX(b.c, b.r), fy = WALL.y + barY(b.r), fw = barW(b.c, b.r);
        const tx = PLAN.x + 14, ty = lineY(PLAN.y, PLAN_LINES[i]!, PLAN.lh, false) - 6, tw = Math.max(20, line.length * charW(PLAN.size));
        const x = fx + (tx - fx) * p, y = fy + (ty - fy) * p, w = fw + (tw - fw) * p, h = RH * 0.62 + (12 - RH * 0.62) * p;
        return <rect key={i} x={x} y={y} width={w} height={h} fill={C.accent} opacity={0.9 * (1 - text)} />;
      })}

      <g opacity={ease(phase(since, 2.0, 2.6))}>
        <Text x={factsX} y={WALL.y + 10} size={22} weight={300} color={C.fg}>Terraform</Text>
        <Text x={factsX} y={WALL.y + 32} size={13}>or OpenTofu, its open fork</Text>
        {[["Calls the AWS APIs directly.", "No stack in between."], ["Nothing to get stuck in", "UPDATE_ROLLBACK_FAILED."], ["The plan is the diff", "you approve in review."]].map((lines, k) => (
          <g key={k}>{lines.map((l, j) => <Text key={j} x={factsX} y={WALL.y + 70 + k * 52 + j * 19} size={14} color={j === 0 ? C.fg : C.muted} mono={l.startsWith("UPDATE")}>{l}</Text>)}</g>
        ))}
        <Text x={factsX} y={WALL.y + 238} size={14} color={C.coral}>The state file is yours now:</Text>
        <Text x={factsX} y={WALL.y + 257} size={14} color={C.coral}>lock it and back it up.</Text>
      </g>

      <Matrix since={since} />
    </g>
  );
}

/** Lines you read before deploying: one square per line. */
function Matrix({ since }: { since: number }) {
  const y0 = 330;
  const pitch = 7;
  const perRow = 96;
  const cdk = 600;
  const shown = Math.floor(ease(phase(since, 2.4, 4.2)) * cdk);
  const tf = Math.floor(ease(phase(since, 4.2, 4.8)) * 7);
  const sx = 170;
  return (
    <g>
      <line x1={0} x2={1152} y1={y0 - 26} y2={y0 - 26} stroke={C.border} />
      <Text x={0} y={y0 - 6} size={13}>lines to read before you deploy, one square each</Text>
      <Text x={0} y={y0 + 26} size={13} mono color={C.fg}>cdk synth</Text>
      <Text x={0} y={y0 + 44} size={13}>{`about ${Math.round(shown / 10) * 10}`}</Text>
      {Array.from({ length: shown }, (_, i) => (
        <rect key={i} x={sx + (i % perRow) * pitch} y={y0 + 10 + Math.floor(i / perRow) * pitch} width={5} height={5} fill={C.fg} opacity={0.3 + hash(i) * 0.25} />
      ))}
      <Text x={0} y={y0 + 104} size={13} mono color={C.fg}>terraform plan</Text>
      <Text x={0} y={y0 + 122} size={13}>{String(tf)}</Text>
      {Array.from({ length: tf }, (_, i) => <rect key={i} x={sx + i * pitch} y={y0 + 96} width={5} height={5} fill={C.accent} />)}
    </g>
  );
}
