import { C, Chip, CoreGrid, LambdaBox, Packet, Scene, Text, Wire, ease, hash, lerp, life, phase } from "./shared";

const P = 7.6;
const N = 12;
const BOX = { x: 290, y: 40, w: 470, h: 360 };

// A seller's listing photo: a green velvet sofa against a wall, on a wooden floor.
const PIXELS = Array.from({ length: N * N }, (_, i) => {
  const r = Math.floor(i / N);
  const c = i % N;
  const arm = (c <= 1 || c >= 10) && r >= 4 && r <= 8;
  const back = c >= 2 && c <= 9 && r >= 2 && r <= 5;
  const seat = c >= 2 && c <= 9 && r >= 6 && r <= 8;
  if (arm) return C.accent;
  if (back) return r === 2 ? C.cyan : C.accent;
  if (seat) return r === 6 ? C.cyan : C.accent;
  if (r === 9 && (c === 1 || c === 10)) return C.amber;
  if (r >= 10) return c % 3 === 0 ? C.coral : C.amber;
  return C.surface;
});

const CODE = [
  "img   = Vips::Image.new_from_file(f)",
  "thumb = img.thumbnail_image(128)",
  "tags  = Model.classify(img)",
  "S3.put(thumb:, tags:)",
];
const LINES = [[1.9, 2.6], [2.6, 3.7], [3.7, 4.9], [4.9, 5.7]] as const;
const TAGS = [["sofa", 0.94], ["velvet", 0.81], ["green", 0.72]] as const;

export function ImagePipeline({ t }: { t: number }) {
  const tt = t % P;
  const fade = 1 - phase(tt, 6.9, 7.5);
  const enter = ease(phase(tt, 0.9, 1.7));
  const shrink = ease(phase(tt, LINES[1][0], LINES[1][1]));
  const scan = phase(tt, LINES[2][0], LINES[2][1]);
  const line = LINES.findIndex(([a, b]) => tt >= a && tt < b);
  const px = 13;
  const ox = lerp(40, BOX.x + 22, enter);
  const oy = lerp(250, BOX.y + 58, enter);
  const thumbIn = phase(tt, 5.1, 5.6);

  return (
    <Scene label="An upload from the core app enters a Lambda where four lines of Ruby call libvips to make a thumbnail and an ONNX model to tag the image, then store both.">
      <CoreGrid x={20} y={60} cols={12} rows={8} t={t} cell={9} label="marketplace" sub="seller lists a sofa" />
      <g opacity={fade}>
        {PIXELS.map((fill, i) => {
          const r = Math.floor(i / N);
          const c = i % N;
          const shown = phase(tt, 0.1 + hash(i) * 0.7, 0.25 + hash(i) * 0.7);
          const scanned = scan > 0 && r / N < scan;
          return (
            <rect key={i} x={ox + c * px} y={oy + r * px} width={px - 2} height={px - 2} fill={fill}
              opacity={shown * (scanned && scan < 1 ? 1 : 0.82)} />
          );
        })}
        {scan > 0 && scan < 1 && (
          <line x1={ox - 6} x2={ox + N * px + 4} y1={oy + scan * N * px} y2={oy + scan * N * px} stroke={C.lavender} strokeWidth={2} filter="url(#ruby-glow)" />
        )}
        <Text x={ox} y={oy + N * px + 18} size={11} mono>listing_8812.jpg</Text>
      </g>

      <LambdaBox {...BOX} title="thumbs.rb" draw={ease(phase(tt, 1.2, 1.8)) * fade}>
        {CODE.map((code, i) => (
          <g key={i}>
            <rect x={BOX.x + 194} y={BOX.y + 60 + i * 30} width={262} height={24} fill={C.accent} opacity={line === i ? 0.14 : 0} style={{ transition: "opacity .25s" }} />
            <Text x={BOX.x + 202} y={BOX.y + 77 + i * 30} size={13.5} mono color={line === i ? C.fg : C.muted}>{code}</Text>
          </g>
        ))}
        <Wire pts={[[BOX.x + 330, BOX.y + 98], [BOX.x + 330, BOX.y + 230], [BOX.x + 110, BOX.y + 230], [BOX.x + 110, BOX.y + 268]]} color={C.accent} opacity={line === 1 ? 0.9 : 0.25} />
        <Wire pts={[[BOX.x + 420, BOX.y + 128], [BOX.x + 420, BOX.y + 268]]} color={C.accent} opacity={line === 2 ? 0.9 : 0.25} />
        <Chip x={BOX.x + 40} y={BOX.y + 268} w={140} label="libvips · C" color={C.cyan} active={line === 1 ? 1 : 0} />
        <Chip x={BOX.x + 340} y={BOX.y + 268} w={120} label="onnxruntime" color={C.lavender} active={line === 2 ? 1 : 0} />
        <Text x={BOX.x + 22} y={BOX.y + BOX.h - 16} size={11}>native code does the pixels</Text>
      </LambdaBox>

      <g opacity={fade}>
        <Packet pts={[[BOX.x + BOX.w, 120], [800, 120]]} p={phase(tt, 4.9, 5.2)} color={C.cyan} />
        <Packet pts={[[BOX.x + BOX.w, 280], [800, 280]]} p={phase(tt, 5.1, 5.4)} color={C.lavender} />
        {PIXELS.filter((_, i) => Math.floor(i / N) % 2 === 0 && i % 2 === 0).map((fill, j) => (
          <rect key={j} x={810 + (j % 6) * lerp(13, 10, shrink)} y={70 + Math.floor(j / 6) * lerp(13, 10, shrink)} width={8} height={8} fill={fill} opacity={thumbIn} />
        ))}
        <Text x={810} y={150} size={11} mono opacity={thumbIn}>thumb_128.jpg</Text>
        {TAGS.map(([tag, score], i) => {
          const grow = phase(tt, LINES[2][0] + i * 0.3, LINES[2][1]);
          const shown = phase(tt, 5.3, 5.7);
          return (
            <g key={tag} opacity={shown}>
              <Text x={810} y={250 + i * 28} size={12} color={C.fg}>{tag}</Text>
              <rect x={870} y={240 + i * 28} width={80 * score * grow} height={8} fill={C.lavender} opacity={0.85} />
              <Text x={980} y={250 + i * 28} anchor="end" size={11}>{score.toFixed(2)}</Text>
            </g>
          );
        })}
        <Text x={810} y={346} size={12} color={C.accent} opacity={life(tt, 5.5, 7.2)}>category: sofa</Text>
        <Text x={810} y={370} size={12} mono color={C.fg} opacity={life(tt, 5.5, 7.2)}>→ s3://media/</Text>
      </g>
    </Scene>
  );
}
