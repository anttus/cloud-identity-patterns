import type { Point } from "./layout";

export type Rect = { x: number; y: number; width: number; height: number };
export type LabelRequest = { id: string; width: number; height: number };

/** Where along a segment to try, in order of preference: centre first, then outward. */
const FRACTIONS = [0.5, 0.35, 0.65, 0.2, 0.8];
const GAP = 3;

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width + GAP &&
  b.x < a.x + a.width + GAP &&
  a.y < b.y + b.height + GAP &&
  b.y < a.y + a.height + GAP;

const centred = (p: Point, w: number, h: number): Rect => ({
  x: p.x - w / 2,
  y: p.y - h / 2,
  width: w,
  height: h,
});

/** Candidate centres on the route: longest segments first, centre of each before its ends. */
const candidates = (route: Point[]): Point[] => {
  const segments = route
    .slice(1)
    .map((b, i) => {
      const a = route[i] as Point;
      return { a, b, length: Math.hypot(b.x - a.x, b.y - a.y) };
    })
    .sort((s, t) => t.length - s.length);
  return segments.flatMap(({ a, b }) =>
    FRACTIONS.map((f) => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })),
  );
};

/**
 * Puts each label ON its own edge, at the first spot that clears every node and every
 * label already placed. If no spot is free, it falls back to the middle of the longest
 * segment: a slight overlap beats a label that drifts away from its line.
 */
export const placeLabels = (
  requests: LabelRequest[],
  routes: Record<string, Point[]>,
  obstacles: Rect[],
): Record<string, Point> => {
  const placed: Rect[] = [];
  const result: Record<string, Point> = {};
  for (const { id, width, height } of requests) {
    const options = candidates(routes[id] ?? []);
    const first = options[0];
    if (!first) continue;
    const free = options.find((p) => {
      const box = centred(p, width, height);
      return !obstacles.some((o) => overlaps(box, o)) && !placed.some((o) => overlaps(box, o));
    });
    const at = free ?? first;
    placed.push(centred(at, width, height));
    result[id] = at;
  }
  return result;
};
