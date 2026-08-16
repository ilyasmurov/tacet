// Semantics of the set: not "what it is called" but "when to take it".
//
// Search tags exist in every icon set. This is a different thing: guidance on
// choosing, addressed first of all to an agent that writes an interface and
// picks an icon by name. That is how trash ends up instead of archive and check
// instead of check-circle — a human catches it by eye, an agent does not.
//
// `use` and `avoid` are in English: the package is international. Synonyms are
// bilingual so search finds a glyph by both "delete" and «удалить».

import { UI_META } from "./metaUi.js";
import { UI_META_2 } from "./metaUi2.js";
import { INSTRUMENT_META } from "./metaInstruments.js";
import { SERVICE_META } from "./metaServices.js";
import type { IconMeta } from "./metaTypes.js";

export type { IconMeta } from "./metaTypes.js";

export const META: Record<string, IconMeta> = {
  ...UI_META,
  ...UI_META_2,
  ...INSTRUMENT_META,
  ...SERVICE_META,
};

/** Whether the glyph has a description. */
export function hasMeta(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(META, name);
}

/** Search by name and synonyms, case-insensitive. */
export function searchIcons(query: string, names: readonly string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...names];
  return names.filter((name) => {
    if (name.includes(q)) return true;
    const meta = META[name];
    if (!meta) return false;
    return meta.synonyms.some((word) => word.toLowerCase().includes(q));
  });
}
