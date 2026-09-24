// Side bearings of the Text layout, in glyph units: the air a glyph keeps to
// its left and right, measured from its ink. Letters and digits keep 1.3 on
// both sides before kerning corrects them; the marks below keep their own — a
// full stop hugs the letter before it, a guillemet hugs the word it opens.
//
// Design data, set by eye on the demo of 24.09.2026. scripts/build-kerning.ts
// reads it to measure advances; the layout never reads it directly.

/** Bearings of letters and digits before kerning, in glyph units. */
export const DEFAULT_SIDE = 1.3;

/** [left, right] bearings of the marks, in glyph units. */
export const MARK_SIDES: Readonly<Record<string, readonly [number, number]>> = {
  "mark-period": [0.9, 1.6],
  "mark-comma": [0.7, 1.6],
  "mark-colon": [1.4, 1.4],
  "mark-semicolon": [1.2, 1.4],
  "mark-hyphen": [1.1, 1.1],
  "mark-dash": [1.1, 1.1],
  "mark-exclamation": [1.6, 1.4],
  "mark-question": [1.3, 1.3],
  "mark-quote-open": [1.0, 0.5],
  "mark-quote-close": [0.5, 1.0],
  "mark-paren-open": [1.4, 0.4],
  "mark-paren-close": [0.4, 1.4],
  "mark-apostrophe": [0.5, 1.2],
  "mark-ellipsis": [0.9, 1.6],
};
