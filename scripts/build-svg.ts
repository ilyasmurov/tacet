// Bakes standalone SVG files and a sprite out of the set's data.
//
// Cuts survive in static files — they are baked into stroke-dasharray. The
// animation does not: it lives at runtime and builds a mask from clones, which a
// file has nowhere to get.
//
// Stroke is computed for 24px by the shared formula. Accent details stay on
// var(--tacet-accent, currentColor): inline the file and the colour comes from
// CSS, drop it in through <img> and the detail simply becomes the text colour.

// We take the built package rather than the sources: inside the core the
// imports carry the .js extension Node requires for ESM, and they do not resolve
// against the sources. Hence the order in package.json: build first, then this.
import { mkdirSync, writeFileSync } from "node:fs";
import { renderSpec, iconNames } from "../packages/core/dist/index.js";

const SIZE = 24;

/**
 * Every file shares one window — the box the set was drawn in.
 *
 * The runtime's optical zoom is not carried over: it compensates for a glyph
 * reading smaller than the text beside it on screen, whereas a file gets scaled
 * to its place anyway. With a single window the icons line up in a grid, both in
 * Figma and in somebody else's sprite. Measured across the whole set, the bounds
 * fit into x 2..22.8 and y 1..22.3 — nothing is clipped, stroke included.
 */
const VIEW_BOX = "0 0 24 24";

function attrsToString(attrs: Record<string, string | number>): string {
  return Object.keys(attrs)
    .map((key) => `${key}="${String(attrs[key])}"`)
    .join(" ");
}

interface Built { name: string; body: string }

function build(name: string): Built {
  // zoom: false — the window is already fixed by the constant, nothing to trim.
  const spec = renderSpec(name, { size: SIZE, zoom: false, idSuffix: name })!;

  const parts: string[] = [];
  if (spec.mask) {
    const children = spec.mask.children.map((c) => `<${c.tag} ${attrsToString(c.attrs)}/>`).join("");
    parts.push(`<mask ${attrsToString(spec.mask.attrs)}>${children}</mask>`);
  }
  parts.push(...spec.parts.map((p) => `<${p.tag} ${attrsToString(p.attrs)}/>`));
  return { name, body: parts.join("") };
}

const outDir = process.argv[2] ?? "svg";
mkdirSync(outDir, { recursive: true });

const built = iconNames().map((name) => build(name));

for (const icon of built) {
  const file =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}" width="${SIZE}" height="${SIZE}" fill="none">` +
    icon.body +
    `</svg>\n`;
  writeFileSync(`${outDir}/${icon.name}.svg`, file, "utf8");
}

const symbols = built
  .map((icon) => `<symbol id="tacet-${icon.name}" viewBox="${VIEW_BOX}">${icon.body}</symbol>`)
  .join("\n  ");
writeFileSync(
  `${outDir}/sprite.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n  ${symbols}\n</svg>\n`,
  "utf8",
);

console.log(`files: ${built.length} + sprite → ${outDir}/  (viewBox ${VIEW_BOX} for all)`);
