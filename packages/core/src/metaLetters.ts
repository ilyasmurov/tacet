// Semantics of the capitals and the marks (TACET-45). A letter glyph is a single
// letter used as an icon — an initial, a monogram, a one-letter badge. A word
// lives in the Text component rather than in a row of these, so every entry
// says so; the confusions that cost an agent a wrong icon get a line of their
// own: O and 0, I and 1, З and 3, X and the close cross, B and bold.

import type { IconMeta } from "./metaTypes.js";

const TEXT = "For a word or a label render it with the Text component rather than glyph by glyph.";

/** Latin letters Cyrillic draws the same way, with their Cyrillic twin. */
const LATIN_TWIN: Record<string, string> = {
  a: "cyrillic-a", b: "cyrillic-ve", c: "cyrillic-es", e: "cyrillic-ie", h: "cyrillic-en", k: "cyrillic-ka",
  m: "cyrillic-em", o: "cyrillic-o", p: "cyrillic-er", t: "cyrillic-te", x: "cyrillic-ha",
};

/** What each Latin letter is confused with, beyond its twin. */
const LATIN_AVOID: Record<string, string> = {
  b: "For bold text formatting use `bold`.",
  i: "For the digit one use `digit-1`; for italic formatting use `italic`.",
  o: "For the digit zero use `digit-0`: O is rounder.",
  s: "For strikethrough formatting use `strikethrough`.",
  t: "For a text or font control use `type`.",
  u: "For underline formatting use `underline`.",
  x: "For closing or deleting use `x`.",
  h: "For a heading level use `heading-1`.",
};

/** Cyrillic capitals: the letter, its Unicode name and how it is called in Russian. */
const CYRILLIC: [string, string, string][] = [
  ["А", "a", "а"], ["Б", "be", "бэ"], ["В", "ve", "вэ"], ["Г", "ghe", "гэ"], ["Д", "de", "дэ"],
  ["Е", "ie", "е"], ["Ё", "io", "ё"], ["Ж", "zhe", "жэ"], ["З", "ze", "зэ"], ["И", "i", "и"],
  ["Й", "short-i", "и краткое"], ["К", "ka", "ка"], ["Л", "el", "эль"], ["М", "em", "эм"], ["Н", "en", "эн"],
  ["О", "o", "о"], ["П", "pe", "пэ"], ["Р", "er", "эр"], ["С", "es", "эс"], ["Т", "te", "тэ"],
  ["У", "u", "у"], ["Ф", "ef", "эф"], ["Х", "ha", "ха"], ["Ц", "tse", "цэ"], ["Ч", "che", "че"],
  ["Ш", "sha", "ша"], ["Щ", "shcha", "ща"], ["Ъ", "hard-sign", "твёрдый знак"], ["Ы", "yeru", "ы"],
  ["Ь", "soft-sign", "мягкий знак"], ["Э", "e", "э"], ["Ю", "yu", "ю"], ["Я", "ya", "я"],
];

const CYRILLIC_AVOID: Record<string, string> = {
  ze: "For the digit three use `digit-3`: З is narrower and has a tongue in the middle.",
  o: "For the digit zero use `digit-0`: О is rounder.",
  ha: "For closing or deleting use `x`.",
};

const unique = (words: string[]) => [...new Set(words)];

function latinMeta(): Record<string, IconMeta> {
  const out: Record<string, IconMeta> = {};
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  letters.forEach((c, i) => {
    const name = `latin-${c}`;
    const twin = LATIN_TWIN[c];
    const avoid = [TEXT, twin ? `Drawn exactly as \`${twin}\`: take the name of the alphabet the text is in.` : "", LATIN_AVOID[c] ?? ""]
      .filter(Boolean).join(" ");
    out[name] = {
      use: `The capital letter ${c.toUpperCase()} as an icon: an initial, a monogram, a one-letter badge.`,
      avoid,
      synonyms: unique([`letter ${c}`, `capital ${c}`, c, `латинская ${c}`, `буква ${c}`]),
      related: [
        ...(i > 0 ? [`latin-${letters[i - 1]}`] : []),
        ...(i < letters.length - 1 ? [`latin-${letters[i + 1]}`] : []),
        ...(twin ? [twin] : []),
      ],
    };
  });
  return out;
}

function cyrillicMeta(): Record<string, IconMeta> {
  const twins = Object.fromEntries(Object.entries(LATIN_TWIN).map(([latin, cyrillic]) => [cyrillic, `latin-${latin}`]));
  const out: Record<string, IconMeta> = {};
  CYRILLIC.forEach(([letter, id, called], i) => {
    const name = `cyrillic-${id}`;
    const twin = twins[name];
    const lower = letter.toLowerCase();
    const avoid = [TEXT, twin ? `Drawn exactly as \`${twin}\`: take the name of the alphabet the text is in.` : "", CYRILLIC_AVOID[id] ?? ""]
      .filter(Boolean).join(" ");
    out[name] = {
      use: `The Cyrillic capital letter ${letter} as an icon: an initial, a monogram, a one-letter badge.`,
      avoid,
      synonyms: unique([`cyrillic ${id.replace("-", " ")}`, `letter ${id.replace("-", " ")}`, lower, `буква ${lower}`, called]),
      related: [
        ...(i > 0 ? [`cyrillic-${CYRILLIC[i - 1]![1]}`] : []),
        ...(i < CYRILLIC.length - 1 ? [`cyrillic-${CYRILLIC[i + 1]![1]}`] : []),
        ...(twin ? [twin] : []),
      ],
    };
  });
  return out;
}

const MARK_META: Record<string, IconMeta> = {
  "mark-period": {
    use: "A full stop, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["full stop", "period", "dot", "точка"],
    related: ["mark-comma", "mark-ellipsis"],
  },
  "mark-comma": {
    use: "A comma, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["comma", "запятая"],
    related: ["mark-period", "mark-semicolon", "mark-apostrophe"],
  },
  "mark-colon": {
    use: "A colon, for text set in the Tacet capitals.",
    avoid: TEXT + " Between the hours and minutes of a live clock use the Digits component: its colon is centred.",
    synonyms: ["colon", "двоеточие"],
    related: ["mark-semicolon", "mark-period"],
  },
  "mark-semicolon": {
    use: "A semicolon, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["semicolon", "точка с запятой"],
    related: ["mark-colon", "mark-comma"],
  },
  "mark-hyphen": {
    use: "A hyphen inside a word, for text set in the Tacet capitals.",
    avoid: TEXT + " For a minus control use `minus`; between words take `mark-dash`.",
    synonyms: ["hyphen", "дефис", "чёрточка"],
    related: ["mark-dash", "minus"],
  },
  "mark-dash": {
    use: "A dash between words, for text set in the Tacet capitals.",
    avoid: TEXT + " Inside a word take `mark-hyphen`.",
    synonyms: ["dash", "em dash", "тире"],
    related: ["mark-hyphen"],
  },
  "mark-exclamation": {
    use: "An exclamation mark, for text set in the Tacet capitals.",
    avoid: TEXT + " For a warning take `alert`.",
    synonyms: ["exclamation mark", "bang", "восклицательный знак"],
    related: ["mark-question", "alert"],
  },
  "mark-question": {
    use: "A question mark, for text set in the Tacet capitals.",
    avoid: TEXT + " For help take `help-circle`.",
    synonyms: ["question mark", "вопросительный знак"],
    related: ["mark-exclamation", "help-circle"],
  },
  "mark-quote-open": {
    use: "An opening guillemet, for text set in the Tacet capitals.",
    avoid: TEXT + " For a quotation block take `quote`.",
    synonyms: ["opening guillemet", "left quote", "открывающая кавычка", "ёлочка"],
    related: ["mark-quote-close", "quote"],
  },
  "mark-quote-close": {
    use: "A closing guillemet, for text set in the Tacet capitals.",
    avoid: TEXT + " For a quotation block take `quote`.",
    synonyms: ["closing guillemet", "right quote", "закрывающая кавычка", "ёлочка"],
    related: ["mark-quote-open", "quote"],
  },
  "mark-paren-open": {
    use: "An opening parenthesis, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["opening parenthesis", "left bracket", "открывающая скобка"],
    related: ["mark-paren-close"],
  },
  "mark-paren-close": {
    use: "A closing parenthesis, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["closing parenthesis", "right bracket", "закрывающая скобка"],
    related: ["mark-paren-open"],
  },
  "mark-apostrophe": {
    use: "An apostrophe, for text set in the Tacet capitals.",
    avoid: TEXT,
    synonyms: ["apostrophe", "апостроф"],
    related: ["mark-comma", "mark-quote-close"],
  },
  "mark-ellipsis": {
    use: "An ellipsis, for text set in the Tacet capitals.",
    avoid: TEXT + " For a menu of more actions take `more-h`.",
    synonyms: ["ellipsis", "three dots", "многоточие"],
    related: ["mark-period", "more-h"],
  },
};

export const LETTER_META: Record<string, IconMeta> = {
  ...latinMeta(),
  ...cyrillicMeta(),
  ...MARK_META,
};
