// Characters of the Text layout and the glyph that draws each of them.

import type { IconName } from "./data.js";

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Cyrillic capitals and the Unicode name each glyph is filed under. */
const CYRILLIC: Record<string, string> = {
  "А": "a", "Б": "be", "В": "ve", "Г": "ghe", "Д": "de", "Е": "ie", "Ё": "io", "Ж": "zhe", "З": "ze", "И": "i",
  "Й": "short-i", "К": "ka", "Л": "el", "М": "em", "Н": "en", "О": "o", "П": "pe", "Р": "er", "С": "es", "Т": "te",
  "У": "u", "Ф": "ef", "Х": "ha", "Ц": "tse", "Ч": "che", "Ш": "sha", "Щ": "shcha", "Ъ": "hard-sign", "Ы": "yeru",
  "Ь": "soft-sign", "Э": "e", "Ю": "yu", "Я": "ya",
};

const MARKS: Record<string, string> = {
  ".": "period", ",": "comma", ":": "colon", ";": "semicolon", "-": "hyphen", "—": "dash", "!": "exclamation",
  "?": "question", "«": "quote-open", "»": "quote-close", "(": "paren-open", ")": "paren-close", "’": "apostrophe",
  "…": "ellipsis",
};

/** Cyrillic capitals drawn exactly as a Latin one: they share its metrics and kerning. */
export const SAME_DRAWING: Readonly<Record<string, string>> = {
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X",
};

/** Every character the Text layout draws, with the glyph that draws it. */
export const TEXT_GLYPHS: Readonly<Record<string, IconName>> = Object.fromEntries([
  ...LATIN.split("").map((ch) => [ch, `latin-${ch.toLowerCase()}`]),
  ...Object.entries(CYRILLIC).map(([ch, name]) => [ch, `cyrillic-${name}`]),
  ..."0123456789".split("").map((ch) => [ch, `digit-${ch}`]),
  ...Object.entries(MARKS).map(([ch, name]) => [ch, `mark-${name}`]),
]) as Record<string, IconName>;

/** The glyph that draws a character in Text, or null when the set has none. */
export function glyphForChar(ch: string): IconName | null {
  return Object.prototype.hasOwnProperty.call(TEXT_GLYPHS, ch) ? TEXT_GLYPHS[ch]! : null;
}

/** The character whose drawing a character shares: А → A, everything else → itself. */
export function drawingOf(ch: string): string {
  return SAME_DRAWING[ch] ?? ch;
}
