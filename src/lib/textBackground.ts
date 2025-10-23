import type { TextMeasureResult } from "./textMetrics";

/**
 * Build a rounded-rect path for a single line.
 */
function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const x2 = x + w;
  const y2 = y + h;
  return [
    `M ${x + rr} ${y}`,
    `H ${x2 - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x2} ${y + rr}`,
    `V ${y2 - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x2 - rr} ${y2}`,
    `H ${x + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x} ${y2 - rr}`,
    `V ${y + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    "Z",
  ].join(" ");
}

/**
 * Creates a unified "blob" by stacking per-line rounded rects with vertical overlap.
 * The overlap removes inner roundings so the outer contour looks like one shape.
 */
export function buildUnifiedBlobPath(
  lineBoxes: TextMeasureResult["lineBoxes"],
  opts: {
    paddingX: number;
    paddingY: number;
    radius: number;
    lineOverlap?: number;
  },
) {
  const { paddingX, paddingY, radius, lineOverlap = 0 } = opts;
  if (!lineBoxes?.length) return "";

  const segments: string[] = [];
  lineBoxes.forEach((line, index) => {
    const width = line.width + paddingX * 2;
    const height = line.height + paddingY * 2;
    const x = line.x - paddingX;
    const y =
      line.y -
      paddingY -
      (index > 0 ? lineOverlap : 0);
    const overlapBottom = index < lineBoxes.length - 1 ? lineOverlap : 0;
    const effectiveHeight = height + overlapBottom + (index > 0 ? lineOverlap : 0);
    segments.push(roundedRectPath(x, y, width, effectiveHeight, radius));
  });

  return segments.join(" ");
}

/**
 * Creates a single block box around the whole paragraph.
 */
export function buildBlockBox(
  lineBoxes: TextMeasureResult["lineBoxes"],
  opts: { paddingX: number; paddingY: number; radius: number },
) {
  const { paddingX, paddingY, radius } = opts;
  if (!lineBoxes?.length) return "";

  const first = lineBoxes[0]!;
  const minX = lineBoxes.reduce((acc, line) => Math.min(acc, line.x), first.x) - paddingX;
  const maxX = lineBoxes.reduce(
    (acc, line) => Math.max(acc, line.x + line.width),
    first.x + first.width,
  ) + paddingX;
  const topY = first.y - paddingY;
  const last = lineBoxes[lineBoxes.length - 1]!;
  const bottomY = last.y + last.height + paddingY;
  const width = maxX - minX;
  const height = bottomY - topY;
  return roundedRectPath(minX, topY, width, height, radius);
}
