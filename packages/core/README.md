# tacet-core

Data and engine of the Tacet icon set. **No dependencies at all** — not even a
peer one. Use it when you build your own wrapper, generate files, or need the
glyph data itself.

For React take [`tacet`](https://www.npmjs.com/package/tacet); for plain HTML
take [`tacet-element`](https://www.npmjs.com/package/tacet-element).

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet-core
```

## Rendering

`renderSpec()` is pure: name in, SVG attributes out. No DOM, no framework.

```js
import { renderSpec } from "tacet-core";

const spec = renderSpec("bell", { size: 24 });
// spec.svgAttrs   → attributes for <svg>
// spec.parts      → [{ tag: "path", attrs: { d, stroke, "stroke-dasharray", … } }]
// spec.mask       → cut-out mask, when the glyph has one
// spec.strokeAttr → value for stroke-width, in viewBox units
```

Put the parts inside `<g class="tc-body">` (exported as `BODY_CLASS`) and give
the `<svg>` the styles from `SVG_STYLE` — `overflow: visible` matters, otherwise
optical zoom clips the edges.

An unknown name returns `null`, including names that exist on `Object.prototype`.

## Animation

Works on a plain DOM element, so any wrapper can use it:

```js
import { animate, prepare, reverse, resetAnimation, resolveAnimateCfg } from "tacet-core";

const cfg = resolveAnimateCfg("bell");
prepare(svg, cfg);            // hide before the first paint
animate(svg, cfg);            // draw in
reverse(svg);                 // erase back out
resetAnimation(svg);          // drop all of it, show the icon as is
```

The draw-in animates a mask built from cloned shapes rather than the contour
itself — otherwise the animation and the cuts would fight over the same
attribute and the gaps would crawl along the path.

## Data

```js
import { ICONS, META, iconNames, hasIcon, searchIcons } from "tacet-core";

iconNames().length;              // 320
ICONS["bell"];                   // parts with gaps as [start%, width%]
META["trash"].avoid;             // what it gets confused with
searchIcons("удалить", iconNames());  // ["trash", …] — synonyms are bilingual
```

## Stroke

```js
import { strokeOnScreen, STROKE_AT_24, STROKE_EXPONENT } from "tacet-core";

strokeOnScreen(128);                          // 3.19 — not 7.2
strokeOnScreen(128, { absoluteStroke: true }); // 1.50
```

MIT © Ilya Smurov
