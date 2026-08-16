// Печёт машиночитаемую семантику набора: icons.json для инструментов и
// llms.txt для агентов.
//
// llms.txt — сложившаяся конвенция: файл в корне сайта, который модель читает,
// чтобы понять проект. Здесь он отвечает на единственный вопрос, который у
// агента возникает про набор иконок: какую взять и с чем её путают.

import { mkdirSync, writeFileSync } from "node:fs";
import { ICONS, META, iconNames } from "../packages/core/dist/index.js";
import { INSTRUMENT_NAMES, SERVICE_NAMES } from "./groups.ts";

const instruments = new Set(INSTRUMENT_NAMES);
const services = new Set(SERVICE_NAMES);

function groupOf(name: string): "interface" | "instrument" | "service" {
  if (instruments.has(name)) return "instrument";
  if (services.has(name)) return "service";
  return "interface";
}

const names = iconNames();

const json = {
  name: "tacet",
  version: "0.1.0",
  license: "MIT",
  total: names.length,
  icons: names.map((name) => {
    const meta = META[name];
    return {
      name,
      group: groupOf(name),
      use: meta?.use ?? "",
      avoid: meta?.avoid ?? null,
      synonyms: meta?.synonyms ?? [],
      related: meta?.related ?? [],
      parts: (ICONS as Record<string, unknown[]>)[name]?.length ?? 0,
    };
  }),
};

const outDir = process.argv[2] ?? "meta";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/icons.json`, JSON.stringify(json, null, 2) + "\n", "utf8");

const GROUP_TITLES: Record<string, string> = {
  interface: "Interface",
  instrument: "Instruments and musical roles",
  service: "Creators and services",
};

const lines: string[] = [
  "# Tacet",
  "",
  `Outline icon set with cuts: ${names.length} glyphs. The cut is data, not geometry —`,
  "each stroke gets pathLength=100 and the gaps live as [start%, width%] in stroke-dasharray.",
  "",
  "MIT. https://tacet.smurov.com",
  "",
  "## How to read this file",
  "",
  "For every glyph: what it is for, what it gets confused with, words it can be found by",
  "and its closest neighbours. Pick by `use`, then check `avoid` — that is where the usual",
  "mistakes are named: trash instead of archive, check instead of check-circle.",
  "",
  "Usage: `<Icon name=\"...\" />` from `tacet-react`, or `<tacet-icon name=\"...\">` from `tacet-element`.",
  "",
];

for (const group of ["interface", "instrument", "service"] as const) {
  const list = names.filter((name) => groupOf(name) === group);
  lines.push(`## ${GROUP_TITLES[group]} (${list.length})`, "");
  for (const name of list) {
    const meta = META[name];
    if (!meta) continue;
    lines.push(`### ${name}`);
    lines.push(meta.use);
    if (meta.avoid) lines.push(`Avoid: ${meta.avoid}`);
    lines.push(`Also known as: ${meta.synonyms.join(", ")}`);
    if (meta.related?.length) lines.push(`See also: ${meta.related.join(", ")}`);
    lines.push("");
  }
}

writeFileSync(`${outDir}/llms.txt`, lines.join("\n"), "utf8");

const described = names.filter((n) => META[n]).length;
const withAvoid = names.filter((n) => META[n]?.avoid).length;
console.log(`icons.json и llms.txt → ${outDir}/`);
console.log(`описано ${described} из ${names.length}, из них с разбором путаницы ${withAvoid}`);
