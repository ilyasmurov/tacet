// Moving glyphs from the Ansamblist set into the Tacet data.
//
// Their format is a subset of this one (`gaps`, `accent`, `fill`, `activeFill`,
// `tf`, `sw`), so the move is mechanical: parse the objects and print them back
// as calls to the same builders data.ts uses.
//
// Names are converted to hyphens: the rest of the set is named that way, and
// `guitar_electric` in the middle of `git-branch` reads as a foreign body. When
// Ansamblist migrates it will do replace(/_/g, "-") on the INSTRUMENTS keys.
//
// Glyphs whose name the Taskless set already holds are skipped — those are
// decided by eye, as a separate step.

export interface RawPart {
  t: "path" | "circle" | "rect" | "hole";
  d?: string;
  cx?: number; cy?: number; r?: number;
  x?: number; y?: number; w?: number; h?: number; rx?: number;
  gaps?: Array<[number, number]> | null;
  accent?: boolean;
  fill?: boolean;
  activeFill?: boolean;
  tf?: string;
  sw?: number;
}

export function toKebab(name: string): string {
  return name.replace(/_/g, "-");
}

function num(n: number): string {
  // Printed compactly: 12.0 → 12, without losing precision.
  return String(Number(n.toFixed(4)));
}

function opts(part: RawPart): string {
  const bits: string[] = [];
  if (part.accent) bits.push("accent: true");
  if (part.fill) bits.push("fill: true");
  if (part.activeFill) bits.push("activeFill: true");
  if (part.tf) bits.push(`tf: ${JSON.stringify(part.tf)}`);
  if (part.sw != null) bits.push(`sw: ${num(part.sw)}`);
  return bits.length ? `{ ${bits.join(", ")} }` : "";
}

function gapsArg(part: RawPart): string {
  if (!part.gaps || !part.gaps.length) return "null";
  return "[" + part.gaps.map(([s, w]) => `[${num(s)}, ${num(w)}]`).join(", ") + "]";
}

/** One part of a glyph, as a builder call — the way data.ts is written by hand. */
export function partToSource(part: RawPart): string {
  const extra = opts(part);
  const tail = (gaps: string) => (extra ? `, ${gaps}, ${extra}` : gaps === "null" ? "" : `, ${gaps}`);

  if (part.t === "circle") {
    // dot() is a filled circle; a separate builder for readable data.
    if (part.fill && !part.gaps) {
      const rest = opts({ ...part, fill: false });
      return `dot(${num(part.cx!)}, ${num(part.cy!)}, ${num(part.r!)}${rest ? `, ${rest}` : ""})`;
    }
    return `c(${num(part.cx!)}, ${num(part.cy!)}, ${num(part.r!)}${tail(gapsArg(part))})`;
  }
  if (part.t === "rect") {
    return `rc(${num(part.x!)}, ${num(part.y!)}, ${num(part.w!)}, ${num(part.h!)}, ${num(part.rx!)}${tail(gapsArg(part))})`;
  }
  return `p(${JSON.stringify(part.d)}${tail(gapsArg(part))})`;
}

export function glyphToSource(name: string, def: RawPart[]): string {
  const parts = def.map(partToSource).join(", ");
  return `  ${JSON.stringify(toKebab(name))}: [${parts}],`;
}

export interface MergeResult {
  source: string;
  added: string[];
  skipped: string[];
}

/** A ready block to paste into data.ts plus a report of what was taken and skipped. */
export function mergeGlyphs(
  incoming: Record<string, RawPart[]>,
  existingNames: ReadonlySet<string>,
): MergeResult {
  const added: string[] = [];
  const skipped: string[] = [];
  const lines: string[] = [];

  for (const [rawName, def] of Object.entries(incoming)) {
    const name = toKebab(rawName);
    if (existingNames.has(name)) { skipped.push(name); continue; }
    lines.push(glyphToSource(rawName, def));
    added.push(name);
  }

  return { source: lines.join("\n"), added, skipped };
}
