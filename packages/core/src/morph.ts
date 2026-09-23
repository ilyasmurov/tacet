// Morphing one contour into another: both are laid out as the same number of
// points along their length, and the points are interpolated. Point i of one
// digit meets point i of the other, start to start and end to end — which is
// why every digit is a single stroke drawn from where a hand would start.

import type { Gap } from "./data.js";

const SVGNS = "http://www.w3.org/2000/svg";

/** Points per contour: enough for a 128px digit to stay smooth mid-flight. */
export const MORPH_POINTS = 90;

const samples = new Map<string, number[] | null>();
let probe: SVGPathElement | null = null;

/** A hidden path the browser measures contours with. */
function probePath(): SVGPathElement | null {
  if (probe?.isConnected) return probe;
  if (typeof document === "undefined") return null;
  const root = document.body ?? document.documentElement;
  if (!root) return null;
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
  probe = document.createElementNS(SVGNS, "path") as SVGPathElement;
  svg.appendChild(probe);
  root.appendChild(svg);
  return probe;
}

/**
 * The contour as `count` points evenly spaced along its length, flat:
 * [x0, y0, x1, y1, …]. Measured once per contour and cached.
 *
 * Null where the browser cannot measure a path — jsdom has no
 * getPointAtLength. The caller then switches the digit at once instead of
 * morphing, which is what a test environment should see anyway.
 */
export function sampleContour(d: string, count = MORPH_POINTS): number[] | null {
  const key = `${count}|${d}`;
  if (samples.has(key)) return samples.get(key)!;
  let out: number[] | null = null;
  const path = probePath();
  if (path && typeof path.getTotalLength === "function" && typeof path.getPointAtLength === "function") {
    try {
      path.setAttribute("d", d);
      const length = path.getTotalLength();
      if (length > 0) {
        out = [];
        for (let i = 0; i < count; i++) {
          const point = path.getPointAtLength((length * i) / (count - 1));
          out.push(point.x, point.y);
        }
      }
    } catch {
      out = null;
    }
  }
  samples.set(key, out);
  return out;
}

/** The first two [start, width] pairs of a list, flattened. */
export type Pair4 = [number, number, number, number];

/**
 * Cuts or accent spans as exactly two pairs, so the lists of two digits can be
 * interpolated number by number. A missing pair becomes a zero-width one,
 * parked where it cannot get in the way of the real one. Digits never carry
 * more than two; a longer list keeps its first two.
 */
export function pairUp(list: readonly Gap[] | null | undefined): Pair4 {
  const [first, second] = [...(list ?? [])].sort((a, b) => a[0] - b[0]);
  if (first && second) return [first[0], first[1], second[0], second[1]];
  if (first) return first[0] < 50 ? [first[0], first[1], 80, 0] : [20, 0, first[0], first[1]];
  return [30, 0, 80, 0];
}

/** Back from four numbers to pairs, zero-width ones dropped. */
export function unpair(q: Readonly<Pair4>): Gap[] {
  const out: Gap[] = [];
  if (q[1] > 0.01) out.push([q[0], q[1]]);
  if (q[3] > 0.01) out.push([q[2], q[3]]);
  return out;
}

/** Cubic in-out: a slow start, a quick middle, a soft landing. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Interpolates two arrays of the same length into `out`, and returns it. */
export function lerpInto<T extends number[]>(out: T, from: readonly number[], to: readonly number[], t: number): T {
  for (let i = 0; i < out.length; i++) out[i] = from[i]! + (to[i]! - from[i]!) * t;
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** A polyline through the points, as path data. */
export function pointsToPath(points: readonly number[]): string {
  let d = "";
  for (let i = 0; i + 1 < points.length; i += 2) {
    d += `${i ? "L" : "M"}${round(points[i]!)} ${round(points[i + 1]!)}`;
  }
  return d;
}
