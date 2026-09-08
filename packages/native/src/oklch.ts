// `oklch()` resolved to a colour React Native can read.
//
// The set writes a handful of glyphs in their own colour rather than
// `currentColor` — the priority arrows, where the colour IS the meaning. That
// colour is written in oklch, which every current browser understands and
// react-native-svg does not: React Native's colour parser returns null, the
// attribute is dropped, and the part is drawn with nothing. No warning, no
// fallback — the glyph is simply absent on the phone, which is exactly how it
// went unnoticed until someone looked at a priority chip on a device.
//
// So the conversion happens here, on the way out, next to the other web-only
// spellings (`currentColor`, `var(...)`) the native renderer already resolves.

/** oklch(L C H) — the only spelling the set emits. Alpha is not used. */
const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i;

/** Oklab → linear sRGB, the matrix from the colour space definition. */
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Linear channel → 8-bit sRGB. Out-of-gamut values are clamped, not scaled:
 *  the set stays inside sRGB, and a colour that ever leaves it is a bug in the
 *  glyph, not something to silently desaturate here. */
function channel(value: number): number {
  const srgb = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(srgb * 255)));
}

/**
 * `oklch(...)` as `#rrggbb`. Anything else comes back untouched — the caller
 * passes every colour through this, and hex, `rgb()` and named colours are
 * already fine for react-native-svg.
 */
export function resolveOklch(value: string): string {
  const m = OKLCH.exec(value.trim());
  if (!m) return value;

  const [, rawL, rawC, rawH] = m as unknown as [string, string, string, string];
  // Lightness is written either as 0..1 or as a percentage; both appear in CSS.
  const L = rawL.endsWith("%") ? Number(rawL.slice(0, -1)) / 100 : Number(rawL);
  const C = Number(rawC);
  const hue = (Number(rawH) * Math.PI) / 180;
  if (!Number.isFinite(L) || !Number.isFinite(C) || !Number.isFinite(hue)) return value;

  const [r, g, b] = oklabToLinearSrgb(L, C * Math.cos(hue), C * Math.sin(hue));
  return `#${[r, g, b].map((v) => channel(v).toString(16).padStart(2, "0")).join("")}`;
}
