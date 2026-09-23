// Semantics of the digits (TACET-28). A digit glyph is a single figure used as
// an icon — a step, a slot of a code, a place. A number that changes lives in the
// Digits component rather than in a row of these.

import type { IconMeta } from "./metaTypes.js";

const AVOID =
  "For an ordered list use `list-numbered`; for a number sign or a tag use `hash`. " +
  "For a number that changes, render it with the Digits component instead of glyph by glyph.";

export const DIGIT_META: Record<string, IconMeta> = {
  "digit-0": {
    use: "The digit zero as an icon: an empty count, a slot of a code, a step marker.",
    avoid: AVOID,
    synonyms: ["zero", "0", "nought", "nil", "ноль", "нуль"],
    related: ["digit-1", "digit-9", "list-numbered"],
  },
  "digit-1": {
    use: "The digit one as an icon: the first step, a single item, a slot of a code.",
    avoid: AVOID + " For a first-level heading use `heading-1`.",
    synonyms: ["one", "1", "first", "один", "единица", "первый"],
    related: ["digit-0", "digit-2", "heading-1", "list-numbered"],
  },
  "digit-2": {
    use: "The digit two as an icon: the second step, a pair, a slot of a code.",
    avoid: AVOID + " For a second-level heading use `heading-2`.",
    synonyms: ["two", "2", "second", "два", "двойка", "второй"],
    related: ["digit-1", "digit-3", "heading-2", "list-numbered"],
  },
  "digit-3": {
    use: "The digit three as an icon: the third step, a slot of a code.",
    avoid: AVOID + " For a third-level heading use `heading-3`.",
    synonyms: ["three", "3", "third", "три", "тройка", "третий"],
    related: ["digit-2", "digit-4", "heading-3", "list-numbered"],
  },
  "digit-4": {
    use: "The digit four as an icon: the fourth step, a slot of a code.",
    avoid: AVOID + " For a fourth-level heading use `heading-4`.",
    synonyms: ["four", "4", "fourth", "четыре", "четвёрка", "четвёртый"],
    related: ["digit-3", "digit-5", "heading-4", "list-numbered"],
  },
  "digit-5": {
    use: "The digit five as an icon: the fifth step, a slot of a code.",
    avoid: AVOID + " For a fifth-level heading use `heading-5`.",
    synonyms: ["five", "5", "fifth", "пять", "пятёрка", "пятый"],
    related: ["digit-4", "digit-6", "heading-5", "list-numbered"],
  },
  "digit-6": {
    use: "The digit six as an icon: the sixth step, a slot of a code.",
    avoid: AVOID + " For a sixth-level heading use `heading-6`.",
    synonyms: ["six", "6", "sixth", "шесть", "шестёрка", "шестой"],
    related: ["digit-5", "digit-7", "digit-9", "heading-6"],
  },
  "digit-7": {
    use: "The digit seven as an icon: the seventh step, a slot of a code.",
    avoid: AVOID,
    synonyms: ["seven", "7", "seventh", "семь", "семёрка", "седьмой"],
    related: ["digit-6", "digit-8", "list-numbered"],
  },
  "digit-8": {
    use: "The digit eight as an icon: the eighth step, a slot of a code.",
    avoid: AVOID,
    synonyms: ["eight", "8", "eighth", "восемь", "восьмёрка", "восьмой"],
    related: ["digit-7", "digit-9", "list-numbered"],
  },
  "digit-9": {
    use: "The digit nine as an icon: the ninth step, a slot of a code.",
    avoid: AVOID,
    synonyms: ["nine", "9", "ninth", "девять", "девятка", "девятый"],
    related: ["digit-8", "digit-0", "digit-6", "list-numbered"],
  },
};
