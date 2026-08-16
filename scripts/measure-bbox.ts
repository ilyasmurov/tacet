// How much room a glyph takes inside the 24×24 box.
//
// Needed for optical zoom: the Taskless set was drawn so that glyphs occupy
// about 74% of the box, and the zoom compensates for that. The Ansamblist glyphs
// were drawn separately, and if their share differs, a shared zoom would either
// inflate them or leave them small.
//
// Curves are measured exactly: Bézier extrema rather than the convex hull of the
// control points. The hull was fine while we compared two sets by one yardstick,
// but for an SVG file's window it overstates the bounds and forces the viewBox
// wider where the glyph actually fits.

export interface Box { minX: number; minY: number; maxX: number; maxY: number }

/** Extrema of a cubic Bézier along one axis — where the derivative is zero. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3);
  const b = 6 * (p0 - 2 * p1 + p2);
  const c = 3 * (p1 - p0);
  const out: number[] = [];
  const at = (t: number) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) {
      const t = -c / b;
      if (t > 0 && t < 1) out.push(at(t));
    }
  } else {
    const d = b * b - 4 * a * c;
    if (d >= 0) {
      const root = Math.sqrt(d);
      for (const t of [(-b + root) / (2 * a), (-b - root) / (2 * a)]) {
        if (t > 0 && t < 1) out.push(at(t));
      }
    }
  }
  return out;
}

/** The same for a quadratic one. */
function quadExtrema(p0: number, p1: number, p2: number): number[] {
  const denom = p0 - 2 * p1 + p2;
  if (Math.abs(denom) < 1e-12) return [];
  const t = (p0 - p1) / denom;
  if (t <= 0 || t >= 1) return [];
  const u = 1 - t;
  return [u * u * p0 + 2 * u * t * p1 + t * t * p2];
}

const CMD = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

function nums(chunk: string): number[] {
  return (chunk.match(NUM) ?? []).map(Number);
}

/** Bounds of a path. Understands relative commands — without that the count lies. */
export function pathBox(d: string): Box | null {
  let x = 0, y = 0, startX = 0, startY = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let seen = false;

  const hit = (px: number, py: number) => {
    seen = true;
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  };

  for (const m of d.matchAll(CMD)) {
    const cmd = m[1]!;
    const args = nums(m[2] ?? "");
    const rel = cmd === cmd.toLowerCase();
    let i = 0;

    switch (cmd.toUpperCase()) {
      case "M":
        while (i < args.length) {
          x = rel ? x + args[i]! : args[i]!;
          y = rel ? y + args[i + 1]! : args[i + 1]!;
          if (i === 0) { startX = x; startY = y; }
          hit(x, y); i += 2;
        }
        break;
      case "L":
        while (i < args.length) {
          x = rel ? x + args[i]! : args[i]!;
          y = rel ? y + args[i + 1]! : args[i + 1]!;
          hit(x, y); i += 2;
        }
        break;
      case "H":
        while (i < args.length) { x = rel ? x + args[i]! : args[i]!; hit(x, y); i += 1; }
        break;
      case "V":
        while (i < args.length) { y = rel ? y + args[i]! : args[i]!; hit(x, y); i += 1; }
        break;
      case "C":
        while (i + 5 < args.length) {
          const x0 = x, y0 = y;
          const c1x = rel ? x + args[i]! : args[i]!, c1y = rel ? y + args[i + 1]! : args[i + 1]!;
          const c2x = rel ? x + args[i + 2]! : args[i + 2]!, c2y = rel ? y + args[i + 3]! : args[i + 3]!;
          x = rel ? x + args[i + 4]! : args[i + 4]!;
          y = rel ? y + args[i + 5]! : args[i + 5]!;
          hit(x0, y0); hit(x, y);
          for (const v of cubicExtrema(x0, c1x, c2x, x)) hit(v, y0);
          for (const v of cubicExtrema(y0, c1y, c2y, y)) hit(x0, v);
          i += 6;
        }
        break;
      case "S":
      case "Q":
        while (i + 3 < args.length) {
          const x0 = x, y0 = y;
          const cx = rel ? x + args[i]! : args[i]!, cy = rel ? y + args[i + 1]! : args[i + 1]!;
          x = rel ? x + args[i + 2]! : args[i + 2]!;
          y = rel ? y + args[i + 3]! : args[i + 3]!;
          hit(x0, y0); hit(x, y);
          // S is a cubic with a mirrored first control point; for bounds,
          // treating it as a quadratic through the given point is enough.
          for (const v of quadExtrema(x0, cx, x)) hit(v, y0);
          for (const v of quadExtrema(y0, cy, y)) hit(x0, v);
          i += 4;
        }
        break;
      case "T":
        while (i + 1 < args.length) {
          x = rel ? x + args[i]! : args[i]!;
          y = rel ? y + args[i + 1]! : args[i + 1]!;
          hit(x, y); i += 2;
        }
        break;
      case "A":
        while (i + 6 < args.length) {
          const x0 = x, y0 = y;
          x = rel ? x + args[i + 5]! : args[i + 5]!;
          y = rel ? y + args[i + 6]! : args[i + 6]!;
          // Measured by the arc endpoints. The "endpoint plus radius" estimate
          // was off by an order of magnitude: arcs in this set are roundings and
          // half-circles that stay between their own ends, while a large radius
          // over a short chord inflated the bounds by ten units where the glyph
          // sits comfortably inside the box.
          hit(x0, y0); hit(x, y);
          i += 7;
        }
        break;
      case "Z":
        x = startX; y = startY;
        break;
    }
  }
  return seen ? { minX, minY, maxX, maxY } : null;
}

/** Bounds of the whole glyph: paths, circles and rectangles together. */
export function glyphBox(def: readonly unknown[]): Box | null {
  let box: Box | null = null;
  const merge = (b: Box | null) => {
    if (!b) return;
    box = box
      ? {
          minX: Math.min(box.minX, b.minX), minY: Math.min(box.minY, b.minY),
          maxX: Math.max(box.maxX, b.maxX), maxY: Math.max(box.maxY, b.maxY),
        }
      : b;
  };

  for (const raw of def) {
    const part = raw as Record<string, number | string | undefined> | null;
    if (!part || part["t"] === "hole") continue;
    if (part["t"] === "path" && typeof part["d"] === "string") {
      merge(pathBox(part["d"]));
    } else if (part["t"] === "circle") {
      const cx = Number(part["cx"]), cy = Number(part["cy"]), r = Number(part["r"]);
      merge({ minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r });
    } else if (part["t"] === "rect") {
      const x = Number(part["x"]), y = Number(part["y"]);
      merge({ minX: x, minY: y, maxX: x + Number(part["w"]), maxY: y + Number(part["h"]) });
    }
  }
  return box;
}

/** What share of the 24×24 box the glyph takes along its larger side. */
export function fillRatio(box: Box | null): number {
  if (!box) return 0;
  return Math.max(box.maxX - box.minX, box.maxY - box.minY) / 24;
}
