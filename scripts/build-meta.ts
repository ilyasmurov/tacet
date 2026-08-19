// Bakes the machine-readable semantics of the set: icons.json for tooling and
// llms.txt for agents.
//
// llms.txt is an established convention: a file at the site root that a model
// reads to understand the project. Here it answers the single question an agent
// actually has about an icon set — which one to take and what it is confused with.

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
  "## Install",
  "",
  "React:      `pnpm add tacet-react`   — `import { Icon } from \"tacet-react\"`",
  "React Native: `pnpm add tacet-native react-native-svg` — `import { Icon } from \"tacet-native\"`, colour is explicit: `<Icon name=\"bell\" color=\"#18181b\" />`",
  "Web component: `pnpm add tacet-element` — `<tacet-icon name=\"bell\">`",
  "Data and engine only: `pnpm add tacet-core` (no dependencies, pulled in by every wrapper)",
  "",
  "Static SVG files for every glyph live in the repository: https://github.com/ilyasmurov/tacet",
  "",
  "## How to read this file",
  "",
  "For every glyph: what it is for, what it gets confused with, words it can be found by",
  "and its closest neighbours. Pick by `use`, then check `avoid` — that is where the usual",
  "mistakes are named: trash instead of archive, check instead of check-circle.",
  "",
  "Usage: `<Icon name=\"...\" />` from `tacet-react` or `tacet-native`, or `<tacet-icon name=\"...\">` from `tacet-element`.",
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
console.log(`icons.json and llms.txt → ${outDir}/`);
console.log(`described ${described} of ${names.length}, of them with a confusion note ${withAvoid}`);
