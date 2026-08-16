// Сборка сайта tacet.smurov.com. Статика: ни фреймворка, ни бэкенда.
//
// Сайт подключает настоящие собранные пакеты, а не копию движка: ядро и
// веб-компонент кладутся рядом и грузятся как ES-модули через import map.
// Значит галерея на странице — это и есть проверка того, что пакет работает.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ICONS, META, iconNames } from "tacet-core";
import { INSTRUMENT_NAMES, SERVICE_NAMES } from "../scripts/groups.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");

const names = iconNames();
const instruments = new Set<string>(INSTRUMENT_NAMES);
const services = new Set<string>(SERVICE_NAMES);
const uiNames = names.filter((n) => !instruments.has(n) && !services.has(n));

const groups = [
  { title: "Интерфейс", names: uiNames },
  { title: "Инструменты и роли", names: names.filter((n) => instruments.has(n)) },
  { title: "Творцы и услуги", names: names.filter((n) => services.has(n)) },
];

// Глифы для первого экрана: разнохарактерные, с заметной анимацией.
const PARADE = [
  "rocket", "waveform", "git-branch", "saxophone", "bell", "folder-tree",
  "check-circle", "handpan", "activity", "sparkles", "balalaika", "target",
];
// Пары, на которых видно, зачем нужна семантика.
const CONFUSED = ["trash", "archive", "check", "check-circle"];
// Инструменты для витрины.
const SHOWCASE_INSTRUMENTS = [
  "saxophone", "balalaika", "handpan", "duduk", "bayan", "harp", "djembe", "sitar",
  "gusli", "kalimba", "didgeridoo", "jaw-harp", "accordion", "banjo", "cello", "timpani",
];

function icon(name: string, size: number, extra = ""): string {
  return `<tacet-icon name="${name}" size="${size}"${extra ? " " + extra : ""}></tacet-icon>`;
}

const bellGaps = JSON.stringify((ICONS as Record<string, Array<{ gaps?: unknown }>>)["bell"]?.[0]?.gaps ?? []);

const metaRows = CONFUSED.map((name) => {
  const meta = META[name]!;
  const avoid = (meta.avoid ?? "").replace(/`([^`]+)`/g, "<b>$1</b>");
  return `<div class="meta-row">
        <div class="glyph">${icon(name, 26)}</div>
        <div>
          <div class="name">${name}</div>
          <div class="use">${meta.use}</div>
          ${avoid ? `<div class="avoid">${avoid}</div>` : ""}
        </div>
      </div>`;
}).join("\n      ");

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tacet — набор иконок</title>
<meta name="description" content="Опенсорсный набор из ${names.length} иконок в стиле «аутлайн с разрезами»: разрез задан данными, отсюда анимация самоотрисовки и четыре плотности разрезов. С описанием, когда какую иконку брать.">
<link rel="icon" href="./svg/note.svg" type="image/svg+xml">
<link rel="stylesheet" href="./fonts/fonts.css">
<link rel="stylesheet" href="./styles.css">
<script type="importmap">
{ "imports": { "tacet-core": "./tacet/core/index.js" } }
</script>
</head>
<body>

<div class="top wrap">
  <div class="inner">
    <a class="brand" href="./">
      ${icon("note", 24)}
      <span>Tacet</span>
    </a>
    <nav>
      <a href="#gallery">Иконки</a>
      <a href="#agents">Для агентов</a>
      <a href="./llms.txt">llms.txt</a>
      <a href="https://github.com/ilyasmurov/tacet">GitHub</a>
    </nav>
  </div>
</div>

<header class="hero wrap">
  <h1>Tacet</h1>
  <p><b>${names.length} иконок</b>, у которых разрез контура задан данными, а не вырезан в геометрии.
  Отсюда анимация самоотрисовки, четыре плотности разрезов и сплошной режим — из одного источника,
  без второго комплекта файлов.</p>
  <div class="install">
    <span id="install-cmd">npm i tacet-react</span>
    <button type="button" data-copy="npm i tacet-react">Скопировать</button>
  </div>
  <div class="parade" id="parade">
    ${PARADE.map((n) => icon(n, 34, 'animate=""')).join("\n    ")}
  </div>
</header>

<section id="cuts">
  <div class="wrap">
    <p class="eyebrow">как это устроено</p>
    <h2>Разрез — это данные</h2>
    <p>Каждому штриху даётся <code>pathLength=100</code>, а разрывы описываются парами «начало и ширина»
    в процентах от длины контура. Подвинуть разрез или убрать его — правка одного числа, а не перерисовка
    пути. Из этой же записи получается и анимация: она рисует контур, а разрезы остаются на месте.</p>
    <div class="cols">
      <div class="card">
        <pre>"bell": [
  p("M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z",
    <b>${bellGaps}</b>),
  p("M10 19a2 2 0 0 0 4 0", null, { accent: true }),
]</pre>
      </div>
      <div class="card demo">
        <div class="demo-item">
          ${icon("bell", 76, 'animate="" id="bell-demo"')}
          <button class="replay" type="button" data-replay="bell-demo">Проиграть снова</button>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="density">
  <div class="wrap">
    <p class="eyebrow">четыре плотности</p>
    <h2>Один глиф, четыре характера</h2>
    <p>Одни и те же данные читаются четырьмя способами: без акцента и с ним, с одним разрезом и со всеми.
    Плюс сплошной режим — для случаев, где разрывы мешают, например у мелких статусных значков.</p>
    <!-- Глиф выбран с двумя разрезами на главном контуре: у одноразрезных
         вариант A не отличить от B, и вся демонстрация теряет смысл. -->
    <div class="card demo">
      <div class="demo-item">${icon("rocket", 56, 'variant="A"')}<span class="label"><b>A</b> один разрез</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="B"')}<span class="label"><b>B</b> все разрезы</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="C"')}<span class="label"><b>C</b> один и акцент</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="D"')}<span class="label"><b>D</b> все и акцент</span></div>
      <div class="demo-item">${icon("rocket", 56, 'solid=""')}<span class="label"><b>solid</b> цельный</span></div>
    </div>
  </div>
</section>

<section id="stroke">
  <div class="wrap">
    <p class="eyebrow">толщина</p>
    <h2>Крупная иконка не жиреет</h2>
    <p>Толщина штриха следует за размером по степенному закону, а не пропорционально: увеличенная вчетверо
    иконка не превращается в жирный чертёж. Нужен ровный волосок на любом размере — есть
    <code>absoluteStroke</code>.</p>
    <div class="card sizes">
      <div class="one">${icon("target", 24)}<span class="px">24px · 1.50</span></div>
      <div class="one">${icon("target", 48)}<span class="px">48px · 2.05</span></div>
      <div class="one">${icon("target", 96)}<span class="px">96px · 2.83</span></div>
      <div class="one">${icon("target", 128)}<span class="px">128px · 3.19</span></div>
    </div>
  </div>
</section>

<section id="instruments">
  <div class="wrap">
    <p class="eyebrow">чего нет у других</p>
    <h2>64 инструмента в одном стиле</h2>
    <p>Дудук, ханг, баян, варган, гусли, диджериду — нарисованы тем же штрихом и с теми же разрезами,
    что и стрелки с папками. Плюс роли: продюсер, звукорежиссёр, дирижёр, битмейкер.</p>
    <div class="card">
      <div class="instruments">
        ${SHOWCASE_INSTRUMENTS.map((n) => `<div class="one">${icon(n, 34)}<span class="name">${n}</span></div>`).join("\n        ")}
      </div>
    </div>
  </div>
</section>

<section id="agents">
  <div class="wrap">
    <p class="eyebrow">для агентов</p>
    <h2>Написано, когда какую иконку брать</h2>
    <p>Интерфейс всё чаще пишет ИИ-агент и выбирает иконку по имени — так и появляется <code>trash</code>
    там, где по смыслу <code>archive</code>. У каждого из ${names.length} глифов записано, для чего он,
    с чем его путают и что взять вместо. Теги для поиска есть у всех наборов; руководства по выбору — нет
    ни у одного.</p>
    <div class="card meta-demo">
      ${metaRows}
    </div>
    <p style="margin-top:22px">Отдаётся как <a href="./llms.txt">llms.txt</a> и
    <a href="./icons.json">icons.json</a>, а в коде — экспортом <code>META</code> из
    <code>tacet-core</code>.</p>
  </div>
</section>

<section id="gallery">
  <div class="wrap">
    <p class="eyebrow">весь набор</p>
    <h2>${names.length} иконок</h2>
    <p>Поиск понимает синонимы на двух языках: «удалить» находит <code>trash</code>, «success» —
    <code>check-circle</code>, «баян» — <code>bayan</code>. Клик копирует готовую строку JSX.</p>

    <div class="gallery-bar">
      <input id="q" type="search" placeholder="Поиск: «удалить», «success», «баян»" autocomplete="off">
      <span class="chips" id="gallery-sizes"></span>
      <span class="chips" id="gallery-variants"></span>
      <span class="counter" id="counter"></span>
    </div>
    <div id="grid-out"></div>
  </div>
</section>

<footer class="wrap">
  <div class="row">
    <a href="https://github.com/ilyasmurov/tacet">GitHub</a>
    <a href="https://www.npmjs.com/package/tacet">npm</a>
    <a href="./llms.txt">llms.txt</a>
    <a href="./icons.json">icons.json</a>
  </div>
  <div class="row">
    <span>MIT · Илья Смуров</span>
    <span>${names.length} глифов</span>
  </div>
</footer>

<div class="toast" id="toast"></div>

<script type="module">
import "./tacet/element/index.js";
import { META, iconNames } from "tacet-core";

const GROUPS = ${JSON.stringify(groups)};
let size = 24, variant = "D", query = "";

const toast = document.getElementById("toast");
let toastTimer;
function say(text) {
  toast.textContent = text;
  toast.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("on"), 1500);
}

document.querySelectorAll("[data-copy]").forEach((el) => {
  el.addEventListener("click", () => {
    navigator.clipboard?.writeText(el.dataset.copy);
    say("Скопировано");
  });
});

document.querySelectorAll("[data-replay]").forEach((el) => {
  el.addEventListener("click", () => {
    const target = document.getElementById(el.dataset.replay);
    target?.render();
  });
});

function matches(name) {
  if (!query) return true;
  if (name.includes(query)) return true;
  const meta = META[name];
  return meta ? meta.synonyms.some((s) => s.toLowerCase().includes(query)) : false;
}

function renderGallery() {
  const box = document.getElementById("grid-out");
  box.textContent = "";
  let shown = 0;

  for (const group of GROUPS) {
    const list = group.names.filter(matches);
    if (!list.length) continue;
    shown += list.length;

    const title = document.createElement("p");
    title.className = "group-title";
    title.textContent = group.title + " · " + list.length;
    box.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "grid";
    for (const name of list) {
      const cell = document.createElement("figure");
      cell.className = "cell";
      cell.style.margin = "0";
      const meta = META[name];
      if (meta) cell.title = meta.use + (meta.avoid ? "\\n\\n" + meta.avoid : "");

      const glyph = document.createElement("tacet-icon");
      glyph.setAttribute("name", name);
      glyph.setAttribute("size", String(size));
      glyph.setAttribute("variant", variant);
      glyph.setAttribute("animate-on-hover", "");
      cell.appendChild(glyph);

      const caption = document.createElement("figcaption");
      caption.className = "cname";
      caption.textContent = name;
      cell.appendChild(caption);

      cell.addEventListener("click", () => {
        navigator.clipboard?.writeText('<Icon name="' + name + '" />');
        cell.classList.add("copied");
        setTimeout(() => cell.classList.remove("copied"), 800);
        say("Скопировано: " + name);
      });
      grid.appendChild(cell);
    }
    box.appendChild(grid);
  }

  if (!shown) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Ничего не нашлось. Попробуй другое слово.";
    box.appendChild(empty);
  }
  document.getElementById("counter").textContent = shown + " из " + iconNames().length;
}

function chips(id, values, get, set, label) {
  const box = document.getElementById(id);
  box.textContent = "";
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label ? label(value) : value;
    button.setAttribute("aria-pressed", String(value === get()));
    button.addEventListener("click", () => {
      set(value);
      chips(id, values, get, set, label);
      renderGallery();
    });
    box.appendChild(button);
  }
}
// Идентификаторы с префиксом: без него чипы «variants» нашли одноимённую
// секцию страницы, отрисовались внутрь неё и стёрли её содержимое.
chips("gallery-sizes", [16, 24, 32, 48], () => size, (v) => { size = v; }, (v) => v + "px");
chips("gallery-variants", ["A", "B", "C", "D"], () => variant, (v) => { variant = v; });

document.getElementById("q").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  renderGallery();
});

renderGallery();

// Первый экран рисуется по очереди — иначе двенадцать иконок вспыхивают разом
// и движение читается как мельтешение.
const parade = document.getElementById("parade");
if (parade && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  [...parade.children].forEach((el, i) => {
    setTimeout(() => el.render?.(), 120 * i);
  });
}
</script>
</body>
</html>
`;

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "index.html"), html, "utf8");
cpSync(join(here, "styles.css"), join(out, "styles.css"));

// Пакеты кладём собранными: страница грузит их как обычные ES-модули.
cpSync(join(root, "packages/core/dist"), join(out, "tacet/core"), { recursive: true });
cpSync(join(root, "packages/element/dist"), join(out, "tacet/element"), { recursive: true });

// Статические SVG и семантика — их же раздаём файлами.
cpSync(join(root, "svg"), join(out, "svg"), { recursive: true });
cpSync(join(root, "meta/llms.txt"), join(out, "llms.txt"));
cpSync(join(root, "meta/icons.json"), join(out, "icons.json"));

// Шрифты: только нужные начертания и подмножества, без латиницы-ext.
const fontDir = join(out, "fonts");
mkdirSync(fontDir, { recursive: true });
const FONTS = [
  ["@fontsource/pt-mono/files/pt-mono-cyrillic-400-normal.woff2", "pt-mono-cyrillic-400.woff2"],
  ["@fontsource/pt-mono/files/pt-mono-latin-400-normal.woff2", "pt-mono-latin-400.woff2"],
  ["@fontsource/onest/files/onest-cyrillic-400-normal.woff2", "onest-cyrillic-400.woff2"],
  ["@fontsource/onest/files/onest-latin-400-normal.woff2", "onest-latin-400.woff2"],
  ["@fontsource/onest/files/onest-cyrillic-600-normal.woff2", "onest-cyrillic-600.woff2"],
  ["@fontsource/onest/files/onest-latin-600-normal.woff2", "onest-latin-600.woff2"],
] as const;
for (const [from, to] of FONTS) {
  cpSync(join(here, "node_modules", from), join(fontDir, to));
}

const face = (family: string, weight: number, file: string, range: string) =>
  `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('./${file}') format('woff2');
  unicode-range: ${range};
}`;
const CYRILLIC = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215";
writeFileSync(
  join(fontDir, "fonts.css"),
  [
    face("PT Mono", 400, "pt-mono-cyrillic-400.woff2", CYRILLIC),
    face("PT Mono", 400, "pt-mono-latin-400.woff2", LATIN),
    face("Onest", 400, "onest-cyrillic-400.woff2", CYRILLIC),
    face("Onest", 400, "onest-latin-400.woff2", LATIN),
    face("Onest", 600, "onest-cyrillic-600.woff2", CYRILLIC),
    face("Onest", 600, "onest-latin-600.woff2", LATIN),
  ].join("\n\n") + "\n",
  "utf8",
);

console.log(`сайт собран → ${out}`);
console.log(`страница ${Math.round(html.length / 1024)} KB, иконок ${names.length}`);
