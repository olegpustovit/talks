import type { ReactNode } from "react";
import { C } from "./shared";

// Isometric drawing in stage pixels: x runs down-right, y runs down-left, z goes up.
// One unit is `u` pixels along each axis; the origin is placed by the caller.
export type P3 = [number, number, number];
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export function makeIso(ox: number, oy: number, u: number) {
  const at = ([x, y, z]: P3): [number, number] => [ox + (x - y) * COS * u, oy + (x + y) * SIN * u - z * u];
  const pts = (ps: P3[]) => ps.map((p) => at(p).map((v) => v.toFixed(1)).join(",")).join(" ");
  const path = (ps: P3[]) => ps.map((p, i) => `${i ? "L" : "M"} ${at(p).map((v) => v.toFixed(1)).join(" ")}`).join(" ");
  return { at, pts, path };
}
export type Iso = ReturnType<typeof makeIso>;

/** A floor: a rhombus at height z with a grid every `step` units. */
export function Plane({ iso, x0, y0, w, d, z, step = 1, color = C.border, fill = C.bg, opacity = 1, grid = 0.5 }: {
  iso: Iso; x0: number; y0: number; w: number; d: number; z: number; step?: number; color?: string; fill?: string; opacity?: number; grid?: number;
}) {
  const lines: ReactNode[] = [];
  for (let i = 1; i < w / step; i++) lines.push(<path key={`a${i}`} d={iso.path([[x0 + i * step, y0, z], [x0 + i * step, y0 + d, z]])} stroke={color} strokeOpacity={grid} />);
  for (let j = 1; j < d / step; j++) lines.push(<path key={`b${j}`} d={iso.path([[x0, y0 + j * step, z], [x0 + w, y0 + j * step, z]])} stroke={color} strokeOpacity={grid} />);
  return (
    <g opacity={opacity}>
      <polygon points={iso.pts([[x0, y0, z], [x0 + w, y0, z], [x0 + w, y0 + d, z], [x0, y0 + d, z]])} fill={fill} fillOpacity={0.85} stroke={color} />
      {lines}
    </g>
  );
}

/** A box: three visible faces, tinted from one colour so it reads as a solid in any palette. */
export function Box({ iso, x, y, z, w, d, h, color, wire, glow = 0 }: {
  iso: Iso; x: number; y: number; z: number; w: number; d: number; h: number; color: string; wire?: boolean; glow?: number;
}) {
  const top: P3[] = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
  const right: P3[] = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
  const left: P3[] = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
  if (wire) {
    return (
      <g fill={C.bg} fillOpacity={0.6} stroke={color} strokeOpacity={0.6 + 0.4 * glow}>
        <polygon points={iso.pts(left)} />
        <polygon points={iso.pts(right)} />
        <polygon points={iso.pts(top)} fill={color} fillOpacity={0.08 + 0.3 * glow} />
      </g>
    );
  }
  return (
    <g>
      <polygon points={iso.pts(left)} fill={color} fillOpacity={0.55 + 0.25 * glow} />
      <polygon points={iso.pts(right)} fill={color} fillOpacity={0.35 + 0.25 * glow} />
      <polygon points={iso.pts(top)} fill={color} fillOpacity={0.85 + 0.15 * glow} />
      <polygon points={iso.pts(top)} fill="none" stroke={C.bg} strokeOpacity={0.5} />
    </g>
  );
}
