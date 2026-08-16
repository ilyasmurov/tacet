# tacet-core

Data and engine of the Tacet icon set — 320 outline glyphs where the **cut is
data, not geometry**. **No dependencies at all**, not even a peer one.

Use it to build your own wrapper, to generate files, or to reach the glyph data
itself. For React take [`tacet-react`](https://www.npmjs.com/package/tacet-react);
for plain HTML take [`tacet-element`](https://www.npmjs.com/package/tacet-element).

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet-core
```

## Rendering

`renderSpec()` is pure: a name in, SVG attributes out. No DOM, no framework.

```js
import { renderSpec, BODY_CLASS, SVG_STYLE } from "tacet-core";

const spec = renderSpec("bell", { size: 24 });

spec.svgAttrs       // attributes for <svg>: viewBox, width, height, fill, data-icon
spec.parts          // [{ tag: "path", attrs: { d, stroke, "stroke-dasharray", … } }]
spec.mask           // cut-out mask, when the glyph has one; otherwise null
spec.strokeAttr     // value for stroke-width, in viewBox units
spec.strokeOnScreen // the same width in CSS pixels
```

Two rules for assembling the markup:

- put the parts inside `<g class="tc-body">` — `BODY_CLASS` exports the name.
  Animation finds what to move by it, and without the group it silently does
  nothing;
- give the `<svg>` the styles from `SVG_STYLE`. `overflow: visible` matters:
  with optical zoom the edges of glyphs reach past the viewBox window, and
  browsers clip them by default.

An unknown name returns `null` — including names that exist on
`Object.prototype`, so `renderSpec("toString")` is `null` rather than a crash.

### Options

| Option | Type | Default | What it does |
|---|---|---|---|
| `size` | `number` | `24` | Size in pixels |
| `variant` | `"A"｜"B"｜"C"｜"D"` | `"D"` | Cut density and whether the accent is painted |
| `solid` | `boolean` | per glyph | Solid contour; the `gaps` data stays untouched |
| `strokeWidth` | `number` | — | Stroke on screen, in pixels |
| `absoluteStroke` | `boolean` | `false` | Stroke stops following size |
| `zoom` | `boolean` | `true` | Optical zoom |
| `accentColor` | `string` | `var(--tacet-accent, currentColor)` | Colour of accent details |
| `idSuffix` | `string` | — | Tail for the mask id, needed when a page holds several copies of the same glyph. Only letters, digits, hyphen and underscore survive |

## Animation

Works on a plain DOM element, so any wrapper can use it. Built on the Web
Animations API: a play starts because it was started, and the previous one on the
same element is cancelled — no transition juggling, no races.

```js
import { animate, prepare, reverse, resetAnimation, resolveAnimateCfg } from "tacet-core";

const cfg = resolveAnimateCfg("bell");   // the glyph's preset, extended by your options
prepare(svg, cfg);       // hide before the first paint, so no frame flashes the result
animate(svg, cfg);       // draw in; calling it again is a replay
reverse(svg);            // erase back out, for loaders and icons leaving the screen
resetAnimation(svg);     // drop every state and show the icon as it is
```

`resetAnimation` matters when a play was prepared but never happened —
unmounted, frame cancelled — otherwise the glyph stays hidden under the mask
without a single error in the console.

The draw-in animates a mask built from clones of the shapes, not the contour
itself: otherwise the animation and the cuts would fight over the same attribute
and the gaps would crawl along the path instead of holding their place.

`prefersReducedMotion()` is respected inside — with the preference on, nothing
moves.

### Config

| Field | Type | Default | What it does |
|---|---|---|---|
| `mode` | `"draw"｜"spin"｜"pop"｜"fade"` | per glyph | Which animation to play |
| `duration` | `number` | `620` | Duration, ms |
| `delay` | `number` | `0` | Delay before the start, ms |
| `spinDeg` | `number` | `90` | Rotation for `spin`, degrees |
| `stagger` | `number` | `0` | Spread of stroke starts, ms |
| `seq` | `number` | `0` | Strict queue of strokes, ms per stroke |

`ANIM[name]` holds the glyph's own preset — `loading` spins, `waveform`
staggers; `resolveAnimateCfg(name, overrides)` merges yours on top.

### Playing on mount

```js
import { canAnimateOnMount } from "tacet-core";

canAnimateOnMount(window.matchMedia.bind(window)); // false on touch devices
```

On a phone icons appear during scrolling: the animation is barely seen and costs
a lot — on a bench of 360 icons it measured 1718 ms against 857 ms without it,
plus a thousand extra nodes in the DOM.

## Data and semantics

```js
import { ICONS, ANIM, SOLID_BY_DEFAULT, META, iconNames, hasIcon, searchIcons } from "tacet-core";

iconNames().length;                   // 320
ICONS["bell"];                        // parts, with cuts as [start%, width%]
ANIM["loading"];                      // the glyph's animation preset
META["trash"].use;                    // "Permanent deletion, the item is gone."
META["trash"].avoid;                  // what it gets confused with and what to take instead
searchIcons("удалить", iconNames());  // ["trash", …] — synonyms are bilingual
```

`META` is the part no other icon set ships: not search tags but guidance on
choosing, written for an agent that picks an icon by name and never sees the
result. Same data as [icons.json](https://tacet.smurov.com/icons.json) and
[llms.txt](https://tacet.smurov.com/llms.txt).

## Stroke and geometry

```js
import { strokeOnScreen, insetFor, dashFor, STROKE_AT_24, STROKE_EXPONENT } from "tacet-core";

strokeOnScreen(128);                           // 3.19 — not 7.2
strokeOnScreen(128, { absoluteStroke: true }); // 1.50
insetFor(24);                                  // optical zoom for this size
dashFor([[12, 9], [58, 9]]);                   // cuts as a stroke-dasharray
```

Stroke follows size by `1.5 × (size / 24) ^ 0.45`: on small sizes it repeats what
the glyphs were drawn with, on large ones it keeps the line from turning into a
blueprint.

## For a React wrapper

```js
import { toReactAttrs } from "tacet-core";
```

The core emits canonical SVG attribute names (`stroke-width`). React renders them
correctly but prints "Invalid DOM property" for each one in dev mode — four
warnings per icon in somebody else's console. `toReactAttrs` translates the names;
the resulting DOM is identical.

## The hover target

The core does not listen to anything itself — hover lives in the wrappers. Both
of them replay the animation on the **nearest clickable ancestor**, and take
`data-tacet-hover` as an explicit target when there is no button around:
[`tacet-react`](https://www.npmjs.com/package/tacet-react),
[`tacet-element`](https://www.npmjs.com/package/tacet-element).

MIT © [Ilya Smurov](https://smurov.com)
