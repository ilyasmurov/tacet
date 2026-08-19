// Build of tacet.smurov.com. Static: no framework, no backend.
//
// The site loads the actual built packages rather than a copy of the engine: the
// core and the custom element sit next to it and load as ES modules through an
// import map. Which makes the gallery on the page a live check that it works.

import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ICONS, META, iconNames } from "tacet-core";
import { INSTRUMENT_NAMES, SERVICE_NAMES } from "../scripts/groups.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");

/**
 * Hash of the built packages. It goes into the path the modules are served
 * from, which makes the cache safe: change the contents and the path changes
 * with it, so a browser can never pair a stale module with a fresh import map.
 *
 * This is not a precaution invented in advance. The modules were served from a
 * fixed path with a week-long cache, then the packages were renamed — and every
 * browser that had been to the site kept a module importing `@tacet/core` while
 * the new import map only knew `tacet-core`. The import failed to resolve, the
 * custom element never registered and the icons quietly stopped appearing.
 *
 * Hashing the directory rather than each file keeps the relative imports inside
 * the packages working untouched.
 */
function hashTree(dir: string): string {
  const hash = createHash("sha256");
  const walk = (current: string) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!full.endsWith(".js")) continue;
      hash.update(relative(dir, full));
      hash.update(readFileSync(full));
    }
  };
  walk(dir);
  return hash.digest("hex").slice(0, 10);
}

const buildId = hashTree(join(root, "packages/core/dist"))
  + hashTree(join(root, "packages/element/dist")).slice(0, 6);
const modulesPath = `./tacet/${buildId}`;

const names = iconNames();
const instruments = new Set<string>(INSTRUMENT_NAMES);
const services = new Set<string>(SERVICE_NAMES);
const uiNames = names.filter((n) => !instruments.has(n) && !services.has(n));

const groups = [
  { title: "Interface", names: uiNames },
  { title: "Instruments and roles", names: names.filter((n) => instruments.has(n)) },
  { title: "Creators and services", names: names.filter((n) => services.has(n)) },
];

// Glyphs for the first screen: varied in character, with visible animation.
// Eleven, not twelve: the twelfth broke onto a second line on a desktop and the
// row stopped reading as a row.
const PARADE = [
  "rocket", "waveform", "git-branch", "saxophone", "bell", "folder-tree",
  "check-circle", "handpan", "activity", "sparkles", "balalaika",
];
// Pairs that show why the semantics is needed at all.
const CONFUSED = ["trash", "archive", "check", "check-circle"];
// Instruments for the showcase.
const SHOWCASE_INSTRUMENTS = [
  "saxophone", "balalaika", "handpan", "duduk", "bayan", "harp", "djembe", "sitar",
  "gusli", "kalimba", "didgeridoo", "jaw-harp", "accordion", "banjo", "cello", "timpani",
];

/**
 * A very small syntax highlighter. A library would mean either a CDN request or
 * a heavy dependency for the sake of three code samples, and the page is meant
 * to stand on its own — so it is one regex per language.
 *
 * One pass, not a chain of replacements: chained rules match the markup the
 * previous ones inserted, and `class` inside an emitted <i class="t"> gets
 * highlighted as an attribute, nesting tags into each other. A single regex
 * with alternatives cannot do that — every character is consumed once.
 *
 * The text is escaped first, so a tag inside a sample can never become markup.
 */
const SYNTAX: Record<"html" | "js", RegExp> = {
  html: /(?<str>"[^"]*")|(?<tag>(?<=&lt;\/?)[a-zA-Z][\w-]*)|(?<attr>[a-zA-Z-]+(?==))/g,
  js: /(?<com>\/\/[^\n]*)|(?<str>"[^"]*"|'[^']*')|(?<kw>\b(?:import|from|const|let|return|function|new)\b)/g,
};

const SYNTAX_CLASS: Record<string, string> = {
  str: "s", tag: "t", attr: "a", com: "c", kw: "k",
};

function highlight(code: string, lang: "html" | "js" | "shell"): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (lang === "shell") {
    // A command line: the tool itself, then its arguments.
    return escaped.replace(/^(\S+)(\s+.*)?$/, (_m, cmd: string, rest = "") =>
      `<i class="k">${cmd}</i>${rest ? `<i class="s">${rest}</i>` : ""}`);
  }

  return escaped.replace(SYNTAX[lang], (match, ...args) => {
    const groups = args[args.length - 1] as Record<string, string | undefined>;
    const kind = Object.keys(groups).find((key) => groups[key] !== undefined);
    return kind ? `<i class="${SYNTAX_CLASS[kind]}">${match}</i>` : match;
  });
}

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
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tacet — icon set</title>
<meta name="description" content="Open-source set of ${names.length} icons in an outline-with-cuts style: the cut is data, hence the draw-in animation and four cut densities. With a note on when to use which icon.">
<link rel="icon" href="./svg/note.svg" type="image/svg+xml">
<link rel="canonical" href="https://tacet.smurov.com/">

<!-- A shared link is half the reason someone clicks, so the card gets a real
     image rather than a bare line of text. -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://tacet.smurov.com/">
<meta property="og:title" content="Tacet — icon set">
<meta property="og:description" content="Open-source set of ${names.length} icons where the cut is data, not geometry: draw-in animation and four cut densities out of one source. MIT.">
<meta property="og:image" content="https://tacet.smurov.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Tacet — icon set">
<meta name="twitter:description" content="Open-source set of ${names.length} icons where the cut is data, not geometry. MIT.">
<meta name="twitter:image" content="https://tacet.smurov.com/og.png">

<!-- Structured data: tells search and language models this is a library with a
     licence, a repository and packages — not a page that happens to mention icons. -->
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "Tacet",
  description: `Outline icon set of ${names.length} glyphs where the cut in a stroke is data rather than geometry: draw-in animation, four cut densities and a solid mode out of a single source. Every glyph carries guidance on when to use it.`,
  url: "https://tacet.smurov.com/",
  codeRepository: "https://github.com/ilyasmurov/tacet",
  license: "https://spdx.org/licenses/MIT.html",
  programmingLanguage: "TypeScript",
  author: { "@type": "Person", name: "Ilya Smurov", url: "https://smurov.com" },
  keywords: ["icons", "icon set", "svg icons", "react icons", "web component", "open source", "animated icons"],
})}
</script>
<link rel="stylesheet" href="./fonts/fonts.css">
<link rel="stylesheet" href="./styles.css">
<script type="importmap">
{ "imports": { "tacet-core": "${modulesPath}/core/index.js" } }
</script>
<script>
// Runs before the first paint on purpose: reading the choice after render would
// show a flash of the wrong theme. Nothing stored means "follow the system",
// and then no attribute is stamped and the media query decides.
try {
  var saved = localStorage.getItem("tacet-theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
} catch (e) { /* private mode: fall back to the system preference */ }
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
      <a href="#gallery">Icons</a>
      <a href="#agents">For agents</a>
      <a href="./llms.txt">llms.txt</a>
      <a href="https://github.com/ilyasmurov/tacet">GitHub</a>
      <button class="theme-toggle" id="theme" type="button" aria-label="Theme"></button>
    </nav>
  </div>
</div>

<header class="hero wrap">
  <h1>Tacet</h1>
  <p><b>${names.length} icons</b> whose contour cut is data rather than something carved into the geometry.
  Hence the draw-in animation, four cut densities and a solid mode — out of one source,
  with no second set of files.</p>
  <div class="install">
    <span id="install-cmd">npm i tacet-react</span>
    <button type="button" data-copy="npm i tacet-react">Copy</button>
  </div>
  <div class="parade" id="parade">
    ${PARADE.map((n) => `<span class="parade-slot" data-tacet-hover>${icon(n, 26, 'animate="" animate-on-hover=""')}</span>`).join("\n    ")}
  </div>
</header>

<section id="cuts">
  <div class="wrap">
    <p class="eyebrow">how it works</p>
    <h2>A cut is data</h2>
    <p>Every stroke gets <code>pathLength=100</code>, and the breaks are described as start-and-width pairs
    in percent of the contour length. Moving a cut or removing it is editing one number, not redrawing the
    path. The animation comes out of the same record: it draws the contour while the cuts hold their place.</p>
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
          ${icon("bell", 52, 'animate="" id="bell-demo"')}
          <button class="replay" type="button" data-replay="bell-demo">Play again</button>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="stacks">
  <div class="wrap">
    <p class="eyebrow">any stack</p>
    <h2>React is one of four ways</h2>
    <p>The engine has no idea React exists: it turns a glyph name into SVG attributes and
    animates a plain DOM element. React is a thin wrapper over it — and so are the custom
    element, which needs no framework at all, and the React Native one, which draws the
    same glyphs on a phone.</p>
    <div class="ways">
      <div class="way">
        <h3>Custom element</h3>
        <p>Works anywhere HTML does: Vue, Svelte, Astro, a plain page, a template
        rendered on the server.</p>
        <pre><code>${highlight('npm i tacet-element', "shell")}</code></pre>
        <pre><code>${highlight(`<script type="module">
  import "tacet-element";
</script>

<tacet-icon name="rocket" size="24"></tacet-icon>
<tacet-icon name="bell" animate></tacet-icon>`, "html")}</code></pre>
      </div>

      <div class="way">
        <h3>React Native</h3>
        <p>The same set on a phone, drawn with react-native-svg. There is no cascade
        there, so the colour is passed in, and cuts are measured into real units —
        <code>pathLength</code> does not exist in React Native. Of the animation modes
        only the draw-in is there so far, played on demand.</p>
        <pre><code>${highlight('npm i tacet-native react-native-svg', "shell")}</code></pre>
        <pre><code>${highlight(`import { Icon } from "tacet-native";

<Icon name="rocket" size={24} color="#18181b" />
<Icon name="bell" replayKey={taps} color="#18181b" />`, "html")}</code></pre>
      </div>

      <div class="way">
        <h3>Engine on its own</h3>
        <p>For your own wrapper, a generator or a build step. No dependencies at all,
        not even a peer one.</p>
        <pre><code>${highlight('npm i tacet-core', "shell")}</code></pre>
        <pre><code>${highlight(`import { renderSpec } from "tacet-core";

const spec = renderSpec("rocket", { size: 24 });
// spec.parts → [{ tag: "path", attrs: {…} }]`, "js")}</code></pre>
      </div>

      <div class="way">
        <h3>Static files</h3>
        <p>No runtime at all. Cuts are baked into the files; only the animation is lost.
        Every glyph is also served here as <a href="./svg/bell.svg">a single SVG</a>.</p>
        <pre><code>${highlight('<img src="bell.svg" width="24" alt="">', "html")}</code></pre>
        <pre><code>${highlight(`<svg width="24" height="24">
  <use href="sprite.svg#tacet-bell"></use>
</svg>`, "html")}</code></pre>
      </div>
    </div>
  </div>
</section>

<section id="density">
  <div class="wrap">
    <p class="eyebrow">four densities</p>
    <h2>One glyph, four characters</h2>
    <p>The same data reads four ways: with and without the accent, with one cut and with all of them.
    Plus a solid mode — for places where breaks get in the way, small status marks for instance.</p>
    <!-- The glyph is chosen with two cuts on its main contour: with a single
         cut A is indistinguishable from B and the whole demo says nothing. -->
    <div class="card demo demo--even">
      <div class="demo-item">${icon("rocket", 56, 'variant="A"')}<span class="label"><b>A</b> one cut</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="B"')}<span class="label"><b>B</b> all cuts</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="C"')}<span class="label"><b>C</b> one and accent</span></div>
      <div class="demo-item">${icon("rocket", 56, 'variant="D"')}<span class="label"><b>D</b> all and accent</span></div>
      <div class="demo-item">${icon("rocket", 56, 'solid=""')}<span class="label"><b>solid</b> unbroken</span></div>
    </div>
  </div>
</section>

<section id="stroke">
  <div class="wrap">
    <p class="eyebrow">stroke</p>
    <h2>A large icon does not get fat</h2>
    <p>Stroke follows size by a power law rather than proportionally: an icon enlarged fourfold does not
    turn into a heavy blueprint. Need an even hairline at any size — there is
    <code>absoluteStroke</code>.</p>
    <div class="card sizes">
      <div class="one">${icon("saxophone", 24)}<span class="px">24px · 1.50</span></div>
      <div class="one">${icon("saxophone", 48)}<span class="px">48px · 2.05</span></div>
      <div class="one">${icon("saxophone", 96)}<span class="px">96px · 2.83</span></div>
      <div class="one">${icon("saxophone", 128)}<span class="px">128px · 3.19</span></div>
    </div>
  </div>
</section>

<section id="instruments">
  <div class="wrap">
    <p class="eyebrow">what others do not have</p>
    <h2>64 instruments in one style</h2>
    <p>Duduk, handpan, bayan, jaw harp, gusli, didgeridoo — drawn with the same stroke and the same cuts
    as the arrows and folders. Plus roles: producer, sound engineer, conductor, beatmaker.</p>
    <div class="card">
      <div class="instruments">
        ${SHOWCASE_INSTRUMENTS.map((n) => `<div class="one">${icon(n, 34)}<span class="name">${n}</span></div>`).join("\n        ")}
      </div>
    </div>
  </div>
</section>

<section id="agents">
  <div class="wrap">
    <p class="eyebrow">for agents</p>
    <h2>It is written down when to use which icon</h2>
    <p>Interfaces are increasingly written by an AI agent that picks an icon by name — which is how
    <code>trash</code> ends up where <code>archive</code> was meant. Each of the ${names.length} glyphs carries
    what it is for, what it gets confused with and what to take instead. Search tags exist in every set;
    a guide to choosing exists in none.</p>
    <div class="card meta-demo">
      ${metaRows}
    </div>
    <p style="margin-top:22px">Shipped as <a href="./llms.txt">llms.txt</a> and
    <a href="./icons.json">icons.json</a>, and in code as the <code>META</code> export from
    <code>tacet-core</code>.</p>
  </div>
</section>

<section id="gallery">
  <div class="wrap">
    <p class="eyebrow">the whole set</p>
    <h2>${names.length} icons</h2>
    <p>Search understands synonyms, and it speaks Russian as well as English: "delete" finds
    <code>trash</code>, "success" finds <code>check-circle</code>. A click copies a ready JSX line.</p>

    <div class="gallery-bar">
      <input id="q" type="search" placeholder="Search: delete, success, bayan" autocomplete="off">
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
    <span>MIT · <a href="https://smurov.com">Ilya Smurov</a></span>
    <span>${names.length} glyphs</span>
  </div>
</footer>

<div class="toast" id="toast"></div>

<script type="module">
import "${modulesPath}/element/index.js";
import { META, iconNames } from "tacet-core";

const GROUPS = ${JSON.stringify(groups)};
let size = 24, variant = "D", query = "";

// Theme: three states rather than two. "system" is the default and stores
// nothing; an explicit choice is remembered and wins over the media query.
const THEME_ORDER = ["system", "light", "dark"];
const THEME_LABEL = {
  system: "Theme: follows the system",
  light: "Theme: light",
  dark: "Theme: dark",
};
const themeButton = document.getElementById("theme");

// The button shows the theme you are actually looking at, not where the choice
// came from: a monitor glyph told nobody whether the page is light or dark right
// now. That the source is the system is said by the dot and the tooltip.
function effectiveTheme(choice) {
  if (choice !== "system") return choice;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function currentTheme() {
  const stamped = document.documentElement.getAttribute("data-theme");
  return stamped === "light" || stamped === "dark" ? stamped : "system";
}

function applyTheme(theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem("tacet-theme");
    else localStorage.setItem("tacet-theme", theme);
  } catch (e) { /* private mode: the choice simply lives for this page */ }
  drawThemeButton(theme);
}

function drawThemeButton(choice) {
  themeButton.textContent = "";
  const glyph = document.createElement("tacet-icon");
  glyph.setAttribute("name", effectiveTheme(choice) === "dark" ? "moon" : "sun");
  glyph.setAttribute("size", "20");
  themeButton.appendChild(glyph);
  themeButton.dataset.auto = choice === "system" ? "true" : "false";
  themeButton.setAttribute("aria-label", THEME_LABEL[choice]);
  themeButton.title = THEME_LABEL[choice];
}

// Following the system means the icon has to follow it too, live.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (currentTheme() === "system") drawThemeButton("system");
});

drawThemeButton(currentTheme());
themeButton.addEventListener("click", () => {
  const next = THEME_ORDER[(THEME_ORDER.indexOf(currentTheme()) + 1) % THEME_ORDER.length];
  applyTheme(next);
});

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
    say("Copied");
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
      // The whole cell is the hover target: aiming at a 24px glyph is no fun.
      cell.dataset.tacetHover = "";
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
        say("Copied: " + name);
      });
      grid.appendChild(cell);
    }
    box.appendChild(grid);
  }

  if (!shown) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nothing found. Try another word.";
    box.appendChild(empty);
  }
  document.getElementById("counter").textContent = shown + " of " + iconNames().length;
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
// Prefixed identifiers: without them the "variants" chips found the section of
// the same name, rendered into it and wiped its contents.
chips("gallery-sizes", [16, 24, 32, 48], () => size, (v) => { size = v; }, (v) => v + "px");
chips("gallery-variants", ["A", "B", "C", "D"], () => variant, (v) => { variant = v; });

document.getElementById("q").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  renderGallery();
});

renderGallery();

// The first screen draws in sequence — otherwise twelve icons flash at once and
// the motion reads as flicker.
const parade = document.getElementById("parade");
if (parade && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  [...parade.children].forEach((el, i) => {
    setTimeout(() => el.render?.(), 120 * i);
  });
}
</script>

<!-- Яндекс.Метрика. Счётчик общий с smurov.com: в его настройках включён учёт
     поддоменов, поэтому tacet.smurov.com попадает в ту же статистику. -->
<script>
if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j=0; j<document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=111664633", "ym");
  ym(111664633, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/111664633" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
</body>
</html>
`;

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "index.html"), html, "utf8");
cpSync(join(here, "styles.css"), join(out, "styles.css"));

// Card for shared links. Drawn once in the language of the page itself — the
// set's own glyphs, PT Mono, the accent blue — and kept as a file: a picture
// that changes with every build would be a moving target for the crawlers
// that cache it.
cpSync(join(here, "og.png"), join(out, "og.png"));

// Packages go in built: the page loads them as plain ES modules. The build id
// in the path is what lets the cache hold them for a week without risk.
//
// Previous builds are wiped rather than kept: the page that references them is
// replaced in the same deploy, and leftovers would pile up build after build.
rmSync(join(out, "tacet"), { recursive: true, force: true });
cpSync(join(root, "packages/core/dist"), join(out, `tacet/${buildId}/core`), { recursive: true });
cpSync(join(root, "packages/element/dist"), join(out, `tacet/${buildId}/element`), { recursive: true });

// Static SVG and the semantics — served as files too.
cpSync(join(root, "svg"), join(out, "svg"), { recursive: true });
cpSync(join(root, "meta/llms.txt"), join(out, "llms.txt"));

// Robots and a sitemap: one page, but a crawler should not have to guess.
writeFileSync(
  join(out, "robots.txt"),
  ["User-Agent: *", "Allow: /", "", "Sitemap: https://tacet.smurov.com/sitemap.xml", ""].join("\n"),
  "utf8",
);
writeFileSync(
  join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://tacet.smurov.com/</loc></url>
</urlset>
`,
  "utf8",
);
cpSync(join(root, "meta/icons.json"), join(out, "icons.json"));

// Fonts: only the weights and subsets we need, no latin-ext.
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

console.log(`site built → ${out}`);
console.log(`page ${Math.round(html.length / 1024)} KB, icons ${names.length}`);
