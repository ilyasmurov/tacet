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
const isDigit = (n: string) => n.startsWith("digit-");
const uiNames = names.filter((n) => !instruments.has(n) && !services.has(n) && !isDigit(n));

const groups = [
  { title: "Interface", names: uiNames },
  { title: "Digits", names: names.filter(isDigit) },
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

/**
 * A section heading that is also a link to its section. A click copies the
 * address with the anchor rather than jumping: the reader is already there and
 * wants something to paste. Without scripts it stays an ordinary link.
 */
function heading(id: string, text: string): string {
  return `<h2><a class="anchor" href="#${id}" data-anchor>${text}<span class="anchor-mark" aria-hidden="true">${icon("link", 18)}</span></a></h2>`;
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
      <a href="#digits">Digits</a>
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
    ${heading("cuts", "A cut is data")}
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
    ${heading("stacks", "React is one of four ways")}
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
    ${heading("density", "One glyph, four characters")}
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

<section id="digits">
  <div class="digit-wall" id="digit-wall" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">digits</p>
    ${heading("digits", "Ten digits that draw themselves")}
    <p>Each digit is one stroke, laid down the way a hand writes it. When a number changes, only the
    digits that changed move: they flow into the new shape, hand over to it, or erase and write it
    again. The accent is data too — a stretch of the contour, stored the way a cut is.</p>
    <div class="digits-bar">
      <span class="chips" id="digits-transition"></span>
      <span class="chips" id="digits-variant"></span>
    </div>
    <div class="card digits-row">
      <tacet-digits id="d-row" value="0123456789" size="48"></tacet-digits>
      <div class="digits-actions">
        <button class="replay" type="button" id="d-shift">Shift</button>
        <button class="replay" type="button" id="d-shuffle">Shuffle</button>
      </div>
    </div>
    <div class="digits-grid">
      <div class="card digits-demo">
        <span class="label">clock</span>
        <tacet-digits id="d-clock" size="40"></tacet-digits>
      </div>
      <div class="card digits-demo">
        <span class="label">counter</span>
        <div class="digits-inbox">Inbox <tacet-digits id="d-badge" class="badge" value="3" size="16"></tacet-digits></div>
        <div class="digits-actions">
          <button class="replay" type="button" data-count="-1">−1</button>
          <button class="replay" type="button" data-count="1">+1</button>
          <button class="replay" type="button" data-count="9">+9</button>
        </div>
      </div>
      <div class="card digits-demo">
        <span class="label">verification code</span>
        <label class="otp">
          <span class="otp-cells">${Array.from({ length: 6 }, () => '<span class="otp-cell"><tacet-digits size="28"></tacet-digits></span>').join("")}</span>
          <input id="d-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="Verification code">
        </label>
      </div>
      <div class="card digits-demo">
        <span class="label">quantity</span>
        <label class="field">
          <span class="field-digits" id="d-field-digits"></span><span class="field-caret"></span>
          <input id="d-field" type="text" inputmode="numeric" maxlength="6" aria-label="Quantity">
        </label>
      </div>
    </div>
    <pre class="digits-code"><code>${highlight(`<Digits value={unread} size={16} />
<Digits value="12:30" transition="relay" />
<tacet-digits value="1248" size="40"></tacet-digits>`, "html")}</code></pre>
  </div>
</section>

<section id="stroke">
  <div class="wrap">
    <p class="eyebrow">stroke</p>
    ${heading("stroke", "A large icon does not get fat")}
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
    ${heading("instruments", "64 instruments in one style")}
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
    ${heading("agents", "It is written down when to use which icon")}
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
    ${heading("gallery", `${names.length} icons`)}
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
import { DIGIT_TIMING, META, iconNames, slotSpec } from "tacet-core";
// The digit wall draws its morphs with the controller's own helpers. They are
// internal modules of the core, served next to its index and loaded by it anyway.
import { accentDash } from "${modulesPath}/core/accent.js";
import { digitGeometry } from "${modulesPath}/core/digitsLayout.js";
import { easeInOutCubic, lerpInto, pairUp, sampleContour, unpair } from "${modulesPath}/core/morph.js";

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

function chips(id, values, get, set, label, onPick = renderGallery) {
  const box = document.getElementById(id);
  box.textContent = "";
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label ? label(value) : value;
    button.setAttribute("aria-pressed", String(value === get()));
    button.addEventListener("click", () => {
      set(value);
      chips(id, values, get, set, label, onPick);
      onPick();
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

// Section links: a click copies the address of the section and puts the anchor
// into the address bar without a jump — the page is already there.
document.querySelectorAll("a[data-anchor]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const hash = link.getAttribute("href");
    history.replaceState(null, "", hash);
    navigator.clipboard?.writeText(location.origin + location.pathname + hash);
    say("Link copied");
  });
});

// ── digits ──
let digitsTransition = "morph", digitsLook = "D";
function dress(el) {
  el.setAttribute("transition", digitsTransition);
  el.setAttribute("variant", digitsLook === "solid" ? "D" : digitsLook);
  el.toggleAttribute("solid", digitsLook === "solid");
}
const dressAll = () => document.querySelectorAll("#digits tacet-digits").forEach(dress);
chips("digits-transition", ["morph", "relay", "erase"], () => digitsTransition, (v) => { digitsTransition = v; }, null, dressAll);
chips("digits-variant", ["A", "B", "C", "D", "solid"], () => digitsLook, (v) => { digitsLook = v; }, null, dressAll);
dressAll();

const row = document.getElementById("d-row");
// Ten digits at 48px need 330px; a phone card has about 290. At 40 they fit.
const narrow = matchMedia("(max-width: 760px)");
const fitRow = () => row.setAttribute("size", narrow.matches ? "40" : "48");
fitRow();
narrow.addEventListener("change", fitRow);
document.getElementById("d-shift").addEventListener("click", () => {
  row.setAttribute("value", [...row.getAttribute("value")].map((c) => String((Number(c) + 1) % 10)).join(""));
});
document.getElementById("d-shuffle").addEventListener("click", () => {
  const all = [...row.getAttribute("value")];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  row.setAttribute("value", all.join(""));
});

const clock = document.getElementById("d-clock");
const two = (n) => String(n).padStart(2, "0");
const tick = () => {
  const now = new Date();
  clock.setAttribute("value", two(now.getHours()) + ":" + two(now.getMinutes()) + ":" + two(now.getSeconds()));
};
tick();
setTimeout(() => { tick(); setInterval(tick, 1000); }, 1000 - new Date().getMilliseconds());

const badge = document.getElementById("d-badge");
let unread = 3;
document.querySelectorAll("[data-count]").forEach((button) => {
  button.addEventListener("click", () => {
    unread = Math.max(0, unread + Number(button.dataset.count));
    badge.setAttribute("value", String(unread));
  });
});

// The code field: a real input under the cells, so a phone shows its digit
// keyboard and fills a code from a message. Each cell is a number of its own.
const otp = document.getElementById("d-otp");
const otpBox = otp.closest(".otp");
const cells = [...otpBox.querySelectorAll(".otp-cell")];
let shown = "";
const markCell = () => {
  const at = Math.min(otp.value.length, cells.length - 1);
  cells.forEach((cell, i) => cell.classList.toggle("on", i === at));
};
otp.addEventListener("input", () => {
  const value = otp.value.replace(/\D/g, "").slice(0, cells.length);
  otp.value = value;
  // A pasted code fills the cells one after another rather than all at once.
  let order = 0;
  cells.forEach((cell, i) => {
    const digit = value[i] ?? "";
    if (digit === (shown[i] ?? "")) return;
    clearTimeout(cell.pending);
    const number = cell.firstElementChild;
    cell.pending = setTimeout(() => number.setAttribute("value", digit), 80 * order++);
  });
  shown = value;
  markCell();
});
otp.addEventListener("focus", () => { otpBox.classList.add("focus"); markCell(); });
otp.addEventListener("blur", () => otpBox.classList.remove("focus"));

// The quantity field: every typed digit is a number of its own, appended on the
// right — a counter grows on the left, a field grows where the caret is.
const field = document.getElementById("d-field");
const fieldBox = field.closest(".field");
const fieldDigits = document.getElementById("d-field-digits");
let typed = "";
field.addEventListener("input", () => {
  const value = field.value.replace(/\D/g, "").slice(0, 6);
  field.value = value;
  let same = 0;
  while (same < typed.length && same < value.length && typed[same] === value[same]) same++;
  const staying = [...fieldDigits.children].filter((el) => !el.dataset.leaving);
  staying.slice(same).reverse().forEach((el) => {
    el.dataset.leaving = "1";
    el.setAttribute("value", "");
    setTimeout(() => el.remove(), 600);
  });
  [...value.slice(same)].forEach((digit, i) => {
    const el = document.createElement("tacet-digits");
    el.setAttribute("size", "30");
    dress(el);
    fieldDigits.appendChild(el);
    setTimeout(() => el.setAttribute("value", digit), 60 * i);
  });
  typed = value;
});
const toEnd = () => field.setSelectionRange(field.value.length, field.value.length);
["click", "keyup", "select"].forEach((type) => field.addEventListener(type, toEnd));
field.addEventListener("focus", () => { fieldBox.classList.add("focus"); toEnd(); });
field.addEventListener("blur", () => fieldBox.classList.remove("focus"));

// ── digit wall ──
// The background of the digits section: faint digits under the heading, the
// text and the demos. The digits near the pointer light up, each one whole and
// by its distance, and the digit under the pointer changes together with its
// four neighbours. Without a pointer the light wanders by itself, and so it
// does while the pointer is over a card that hides the wall: it sets off from
// where the pointer left it. The wall takes no pointer events itself; the
// section listens, so the demos on top keep working.
//
// The band is one canvas. As six hundred SVGs it took a sixth of a core and
// dropped the page to 42 fps (measured 23.09.2026): every change repainted the
// dashed contours around it and rebuilt the compositing layers. Here a digit at
// rest is a sprite drawn once per figure, and a morph is drawn frame by frame
// with the helpers the digits controller itself uses: sampled contours, cuts
// and accent spans interpolated, the exact glyph put back at the end.
//
// The wall fills in only when it comes near the viewport, and nothing runs
// while it is off screen or the tab is hidden. It sits in a block of its own,
// so that its names cannot clash with the rest of the page script.
{
  const wall = document.getElementById("digit-wall"), zone = wall.parentElement;
  // The resting opacity, the light's radius in rows, the fade time constant in s.
  // Under text the floor is far lower than it was as a band of its own (0.18).
  const WALL_SIZE = 24, WALL_FLOOR = 0.07, WALL_RADIUS = 2.6, WALL_FADE = 0.12;
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  // Dash patterns are stored in percent of the contour; the canvas wants lengths.
  const rulerBox = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const ruler = document.createElementNS("http://www.w3.org/2000/svg", "path");
  rulerBox.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
  rulerBox.appendChild(ruler);
  wall.append(canvas, rulerBox);

  // Every digit shares the slot's frame: the same view box and stroke width.
  const frameSpec = slotSpec("0", { size: WALL_SIZE });
  const cellW = Number(frameSpec.svgAttrs.width);
  const [VX, VY, , VH] = String(frameSpec.svgAttrs.viewBox).split(" ").map(Number);
  const SCALE = WALL_SIZE / VH, STROKE = Number(frameSpec.parts[0].attrs["stroke-width"]);

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, left = 0, top = 0, cellPx = 0, rowPx = 0, ink = "", accentInk = "";
  let chars = [], level = new Float32Array(0), goal = new Float32Array(0);
  let glowing = new Set(), aimAt = "", cellAt = "", movedAt = -Infinity;
  let near = false, inside = false, covered = false, frame = 0, lastNow = 0, flownAt = 0, idleTimer = 0, refillTimer = 0;
  // Where the light is and where it heads when it wanders on its own.
  let lightX = null, lightY = null, heading = Math.random() * Math.PI * 2, turn = 0;
  const active = new Set(), flights = new Map(), sprites = new Map(), shapes = new Map();
  const anyDigit = () => String(Math.floor(Math.random() * 10));
  const otherDigit = (c) => { let n; do n = anyDigit(); while (n === c); return n; };
  const cellX = (c) => Math.round((left + c * cellW) * dpr), cellY = (r) => Math.round((top + r * WALL_SIZE) * dpr);
  const lengths = (list, unit) => String(list).split(" ").filter(Boolean).map((v) => Number(v) * unit);
  const roams = () => (!inside || covered) && !calm.matches;
  // What lies over the wall and hides it: under these the pointer lights nothing.
  const COVERS = ".card, .digits-code, .chips";

  // Strokes a contour in glyph units: the body in ink, then the accent. Each is
  // a dash pattern with an offset, in percent of the contour, as the core gives
  // them; unit turns percent into length.
  function stroke(p, path, unit, body, accent) {
    p.lineCap = "round";
    p.lineJoin = "round";
    p.lineWidth = STROKE;
    for (const [pattern, colour] of [[body, ink], [accent, accentInk]]) {
      if (!pattern) continue;
      p.strokeStyle = colour;
      p.setLineDash(lengths(pattern.dash, unit));
      p.lineDashOffset = pattern.offset * unit;
      p.stroke(path);
    }
  }

  // A digit at rest, drawn once per figure from the same spec an SVG slot uses,
  // at full strength. A cell puts the sprite down at its light, so the digit
  // fades as a whole, the way an opacity on an SVG slot fades it.
  function sprite(ch) {
    let sheet = sprites.get(ch);
    if (sheet) return sheet;
    const parts = slotSpec(ch, { size: WALL_SIZE }).parts;
    const main = parts[0].attrs, span = parts.find((part) => part.attrs["data-accent"]);
    ruler.setAttribute("d", main.d);
    sheet = document.createElement("canvas");
    sheet.width = cellPx;
    sheet.height = rowPx;
    const pen = sheet.getContext("2d");
    pen.setTransform(dpr * SCALE, 0, 0, dpr * SCALE, -dpr * VX * SCALE, -dpr * VY * SCALE);
    stroke(pen, new Path2D(main.d), ruler.getTotalLength() / 100, { dash: main["stroke-dasharray"] ?? "100 0", offset: 0 },
      span ? { dash: span.attrs["stroke-dasharray"], offset: Number(span.attrs["stroke-dashoffset"] ?? 0) } : null);
    sprites.set(ch, sheet);
    return sheet;
  }

  // A digit's contour sampled for a morph, with its cuts and spans as pairs.
  function shape(ch) {
    let form = shapes.get(ch);
    if (!form) {
      const geometry = digitGeometry(ch);
      form = { points: sampleContour(geometry.d), cuts: pairUp(geometry.cuts), spans: geometry.spans ? pairUp(geometry.spans) : null };
      shapes.set(ch, form);
    }
    return form;
  }

  // One frame of a morph, drawn straight onto the band at the cell's light:
  // the polyline between two sampled contours, with the cuts and the accent
  // where the interpolation has them now. The body leaves out the stretch under
  // the accent, so the two strokes never overlap and the low alpha does not
  // darken where they would. Measured 23.09.2026, the other ways cost frames:
  // a small sheet per digit meant a texture upload each (15 fps), a clip with
  // destination-in a change of render target each (19 fps).
  function paintFlight(i, f, x, y) {
    // Every other sample, and always the last one: at 24 px the contour is as
    // smooth, and the path costs half.
    const pts = f.now.points, path = new Path2D(), last = pts.length - 2;
    let length = 0, px = pts[0], py = pts[1];
    path.moveTo(px, py);
    for (let k = 4; ; k += 4) {
      if (k > last) k = last;
      const dx = pts[k] - px, dy = pts[k + 1] - py;
      length += Math.sqrt(dx * dx + dy * dy);
      px = pts[k]; py = pts[k + 1];
      path.lineTo(px, py);
      if (k === last) break;
    }
    const cuts = unpair(f.now.cuts), spans = f.now.spans ? unpair(f.now.spans) : [];
    ctx.save();
    ctx.globalAlpha = level[i];
    ctx.setTransform(dpr * SCALE, 0, 0, dpr * SCALE, x - dpr * VX * SCALE, y - dpr * VY * SCALE);
    stroke(ctx, path, length / 100, accentDash([[0, 100]], [...cuts, ...spans]), spans.length ? accentDash(spans, cuts) : null);
    ctx.restore();
  }

  function readInk() {
    const style = getComputedStyle(wall);
    ink = style.color;
    accentInk = style.getPropertyValue("--tacet-accent").trim() || ink;
    sprites.clear();
  }

  // Redraws one cell at its current light, in device pixels.
  function paint(i) {
    const x = cellX(i % cols), y = cellY(Math.floor(i / cols)), f = flights.get(i);
    ctx.clearRect(x, y, cellPx, rowPx);
    if (f) return paintFlight(i, f, x, y);
    ctx.globalAlpha = level[i];
    ctx.drawImage(sprite(chars[i]), x, y);
  }

  // A section-sized canvas at a phone's 3x would take tens of megabytes; faint
  // digits in the background look the same at 2x.
  const density = () => Math.min(2, devicePixelRatio || 1);

  function fillWall() {
    const width = wall.clientWidth, height = wall.clientHeight;
    if (!width || (width === W && height === H && density() === dpr)) return;
    W = width; H = height; dpr = density();
    cols = Math.floor(W / cellW); rows = Math.floor(H / WALL_SIZE);
    left = (W - cols * cellW) / 2; top = (H - rows * WALL_SIZE) / 2;
    cellPx = Math.ceil(cellW * dpr); rowPx = Math.ceil(WALL_SIZE * dpr);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    chars = Array.from({ length: rows * cols }, anyDigit);
    level = new Float32Array(rows * cols).fill(WALL_FLOOR);
    goal = new Float32Array(rows * cols).fill(WALL_FLOOR);
    active.clear(); flights.clear(); glowing = new Set(); aimAt = ""; cellAt = "";
    readInk();
    for (let i = 0; i < chars.length; i++) paint(i);
  }

  // A digit changes. A change that comes mid-morph starts from where the
  // contour is now, like set() on the controller.
  function change(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const i = r * cols + c, from = chars[i];
    chars[i] = otherDigit(from);
    const target = shape(chars[i]), current = flights.get(i)?.now ?? shape(from);
    if (calm.matches || !target.points || !current.points) {
      flights.delete(i);
      paint(i);
      return;
    }
    const copy = (form) => ({ points: form.points.slice(), cuts: form.cuts.slice(), spans: form.spans ? form.spans.slice() : null });
    const start = copy(current);
    if (!start.spans && target.spans) start.spans = target.spans.slice();
    flights.set(i, { from: start, goal: target, now: copy(start), start: performance.now() });
    kick();
  }

  function fly(now) {
    for (const [i, f] of flights) {
      const k = Math.min(1, Math.max(0, (now - f.start) / DIGIT_TIMING.morph)), e = easeInOutCubic(k);
      lerpInto(f.now.points, f.from.points, f.goal.points, e);
      lerpInto(f.now.cuts, f.from.cuts, f.goal.cuts, e);
      if (f.now.spans && f.goal.spans) lerpInto(f.now.spans, f.from.spans, f.goal.spans, e);
      // The polyline lives only in flight: at rest the cell holds the exact glyph.
      if (k >= 1) flights.delete(i);
      paint(i);
    }
  }

  // Where the light is aimed: the nearest digit gets full brightness, the ones
  // around it less, down to the floor at WALL_RADIUS rows. Nothing is recomputed
  // while the light stays within the same quarter of a cell.
  function aim(x, y) {
    const at = x === null ? "" : Math.round((y - top) / WALL_SIZE * 4) + ":" + Math.round((x - left) / cellW * 4);
    if (at === aimAt) return;
    aimAt = at;
    const next = new Set();
    if (x !== null) {
      const fr = (y - top) / WALL_SIZE - 0.5, fc = (x - left) / cellW - 0.5;
      const r0 = Math.round(fr), c0 = Math.round(fc);
      const dr = Math.ceil(WALL_RADIUS), dc = Math.ceil(WALL_RADIUS * WALL_SIZE / cellW);
      for (let r = Math.max(0, r0 - dr); r <= Math.min(rows - 1, r0 + dr); r++) {
        for (let c = Math.max(0, c0 - dc); c <= Math.min(cols - 1, c0 + dc); c++) {
          const d = Math.hypot((c - fc) * cellW, (r - fr) * WALL_SIZE) / WALL_SIZE;
          if (d >= WALL_RADIUS) continue;
          const t = 1 - d / WALL_RADIUS, i = r * cols + c;
          goal[i] = WALL_FLOOR + (1 - WALL_FLOOR) * t * t * (3 - 2 * t);
          next.add(i);
          active.add(i);
        }
      }
    }
    for (const i of glowing) if (!next.has(i)) { goal[i] = WALL_FLOOR; active.add(i); }
    glowing = next;
  }

  // Every digit whose light is on its way somewhere moves towards it, the way a
  // CSS transition would, and is redrawn when the change is visible. Digits in
  // flight are redrawn by fly() anyway.
  function step(dt) {
    const k = 1 - Math.exp(-dt / WALL_FADE);
    for (const i of active) {
      const before = Math.round(level[i] * 40);
      level[i] += (goal[i] - level[i]) * k;
      if (Math.abs(goal[i] - level[i]) < 0.005) level[i] = goal[i];
      if (Math.round(level[i] * 40) !== before && !flights.has(i)) paint(i);
      if (level[i] === goal[i]) active.delete(i);
    }
  }

  // The light entered a new cell: its digit changes, the four neighbours follow.
  function pass(x, y) {
    const r = Math.floor((y - top) / WALL_SIZE), c = Math.floor((x - left) / cellW), at = r + ":" + c;
    if (at === cellAt) return;
    cellAt = at;
    change(r, c);
    setTimeout(() => { change(r, c - 1); change(r, c + 1); change(r - 1, c); change(r + 1, c); }, 90);
  }

  // Without a pointer the light wanders: about 110 px a second across and 70
  // down, turning a little at random and turning back at the edges, clear of
  // the fade at the top and the bottom. It sets off from wherever the light
  // is, so taking over from the pointer shows no jump.
  function wander(dt) {
    if (lightX === null) { lightX = W / 2; lightY = H / 2; }
    turn = Math.max(-1.2, Math.min(1.2, turn + (Math.random() - 0.5) * 6 * dt));
    heading += turn * dt;
    lightX += Math.cos(heading) * 110 * dt;
    lightY += Math.sin(heading) * 70 * dt;
    if (lightX < 30 || lightX > W - 30) { heading = Math.PI - heading; lightX = Math.max(30, Math.min(W - 30, lightX)); }
    if (lightY < 90 || lightY > H - 90) { heading = -heading; lightY = Math.max(90, Math.min(H - 90, lightY)); }
    aim(lightX, lightY);
    pass(lightX, lightY);
  }

  function tick(now) {
    frame = 0;
    if (!near || document.hidden) return;
    const dt = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    if (roams()) wander(dt);
    step(dt);
    // Morphs move at thirty frames a second: a 480 ms morph still takes some
    // fourteen, and there are a dozen or more in flight at once.
    if (now - flownAt >= 30) {
      flownAt = now;
      fly(now);
    }
    if (roams() || active.size || flights.size) frame = requestAnimationFrame(tick);
  }

  function kick() {
    if (frame || !near || document.hidden || !rows) return;
    lastNow = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function idle() {
    if (performance.now() - movedAt < 1500 || !rows) return;
    change(Math.floor(Math.random() * rows), Math.floor(Math.random() * cols));
  }

  function wake() {
    const on = near && rows > 0 && !document.hidden && !calm.matches;
    if (on && !idleTimer) idleTimer = setInterval(idle, 350);
    if (!on && idleTimer) { clearInterval(idleTimer); idleTimer = 0; }
    kick();
  }

  // The pointer leaving the section, or going over a card, hands the light over
  // to wander(), which carries on from the spot the pointer lit last.
  zone.addEventListener("pointerenter", () => { inside = true; });
  zone.addEventListener("pointerleave", () => { inside = false; covered = false; cellAt = ""; kick(); });
  zone.addEventListener("pointermove", (event) => {
    if (!rows) return;
    covered = event.target instanceof Element && !!event.target.closest(COVERS);
    if (covered) {
      cellAt = "";
      kick();
      return;
    }
    const box = wall.getBoundingClientRect();
    lightX = event.clientX - box.left;
    lightY = event.clientY - box.top;
    movedAt = performance.now();
    aim(lightX, lightY);
    pass(lightX, lightY);
    kick();
  });
  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) fillWall();
    wake();
  }, { rootMargin: "200px 0px" }).observe(wall);
  new ResizeObserver(() => {
    clearTimeout(refillTimer);
    refillTimer = setTimeout(() => { if (near) { fillWall(); kick(); } }, 150);
  }).observe(wall);
  document.addEventListener("visibilitychange", wake);
  calm.addEventListener("change", wake);
  // The canvas keeps the colours it was painted with; the theme lives in an
  // attribute on <html> and in the system setting, so both repaint it.
  const repaint = () => {
    if (!rows) return;
    readInk();
    for (let i = 0; i < chars.length; i++) paint(i);
  };
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);
}

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
