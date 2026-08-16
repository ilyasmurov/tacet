// The semantics type lives on its own so the parts (interface, instruments,
// services) do not pull each other in or loop back through the barrel.

export interface IconMeta {
  /** When to take it. One phrase, no padding. */
  use: string;
  /** What it gets confused with and what to take instead. Empty when nothing does. */
  avoid?: string;
  /** Words to search by: English and Russian. */
  synonyms: string[];
  /** Neighbours in meaning — worth considering alongside. */
  related?: string[];
}
