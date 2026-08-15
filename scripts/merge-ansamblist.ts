// Перенос глифов из набора Ansamblist в данные Tacet.
//
// Формат там — подмножество здешнего (`gaps`, `accent`, `fill`, `activeFill`,
// `tf`, `sw`), поэтому перенос механический: разбираем объекты и печатаем их
// обратно вызовами тех же билдеров, что используются в data.ts.
//
// Имена приводим к дефисам: весь остальной набор так и назван, а `guitar_electric`
// посреди `git-branch` читается как чужое. Ansamblist при переезде сделает
// replace(/_/g, "-") на ключах INSTRUMENTS.
//
// Глифы, чьё имя уже занято набором Taskless, пропускаются — по ним решение
// принимается глазами, отдельным шагом.

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
  // Печатаем компактно: 12.0 → 12, но точность не теряем.
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

/** Одна часть глифа — вызовом билдера, как это написано в data.ts вручную. */
export function partToSource(part: RawPart): string {
  const extra = opts(part);
  const tail = (gaps: string) => (extra ? `, ${gaps}, ${extra}` : gaps === "null" ? "" : `, ${gaps}`);

  if (part.t === "circle") {
    // dot() — это залитый кружок; отдельный билдер ради читаемости данных.
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

/** Готовый блок для вставки в data.ts плюс отчёт, что взяли и что пропустили. */
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
