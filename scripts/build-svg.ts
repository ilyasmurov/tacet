// Печёт из данных набора отдельные SVG-файлы и спрайт.
//
// Разрезы в статике сохраняются — они запечены в stroke-dasharray. Анимация
// теряется: она живёт в рантайме и строит маску из клонов, файлу это негде взять.
//
// Толщина считается для 24px по общей формуле. Акцентные детали остаются на
// var(--tacet-accent, currentColor): вставишь файл инлайном — цвет подхватится
// из CSS, вставишь через <img> — деталь просто станет цветом текста.

// Берём собранный пакет, а не исходники: внутри ядра импорты идут с
// расширением .js, как требует Node для ESM, и по исходникам не резолвятся.
// Отсюда и порядок в package.json: сначала build, потом этот скрипт.
import { mkdirSync, writeFileSync } from "node:fs";
import { renderSpec, iconNames } from "../packages/core/dist/index.js";

const SIZE = 24;

/**
 * Окно у всех файлов одно и то же — бокс, в котором набор рисовался.
 *
 * Оптический зум рантайма сюда не переносим: он компенсирует то, что на экране
 * глиф читается мельче соседнего текста, а файл всё равно масштабируют под своё
 * место. Зато при едином окне иконки выравниваются в сетке и в Фигме, и в чужом
 * спрайте. Замер по всему набору: габариты укладываются в x 2..22.8 и y 1..22.3,
 * то есть ничего не срезается даже с учётом штриха.
 */
const VIEW_BOX = "0 0 24 24";

function attrsToString(attrs: Record<string, string | number>): string {
  return Object.keys(attrs)
    .map((key) => `${key}="${String(attrs[key])}"`)
    .join(" ");
}

interface Built { name: string; body: string }

function build(name: string): Built {
  // zoom: false — окно уже задано константой, второй раз обрезать нечего.
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

console.log(`файлов: ${built.length} + спрайт → ${outDir}/  (viewBox ${VIEW_BOX} у всех)`);
