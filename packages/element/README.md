# tacet-element

`<tacet-icon>` — the Tacet icon set for projects without React. 320 outline
glyphs where the **cut is data, not geometry**.

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet-element
```

Importing the package registers the element:

```html
<script type="module">import "tacet-element";</script>

<tacet-icon name="rocket" size="24"></tacet-icon>
<tacet-icon name="bell" size="20" animate></tacet-icon>
<tacet-icon name="saxophone" size="32" variant="A"></tacet-icon>
<tacet-icon name="status-done" solid label="Done"></tacet-icon>
```

Works anywhere HTML does: Vue, Svelte, Astro, a plain page, a template rendered
on the server. For React take
[`tacet-react`](https://www.npmjs.com/package/tacet-react).

## Attributes

### Appearance

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `name` | glyph name | — | Which glyph to draw |
| `size` | number | `24` | Size in pixels, used for width and height |
| `variant` | `A` `B` `C` `D` | `D` | A — one cut · B — all cuts · C — one cut and accent · D — all and accent |
| `solid` | present / absent | per glyph | Solid contour: cuts are not drawn |
| `stroke-width` | number | — | Stroke width **on screen**, in pixels |
| `absolute-stroke` | present / absent | absent | Stroke stops following size: 1.5px at any size |
| `zoom` | `false` to disable | on | Optical zoom |
| `accent-color` | any CSS colour | `var(--tacet-accent, currentColor)` | Colour of accent details |
| `label` | text | — | Accessible label. Without it the icon is `aria-hidden` |

### Animation

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `animate` | present / absent | absent | Play the draw-in when the element is connected |
| `animate-on-hover` | present / absent | absent | Replay on hover — see the hover target below |
| `animation-mode` | `draw` `spin` `pop` `fade` | per glyph | Override the glyph's preset |
| `animation-delay` | number | `0` | Delay before the start, ms |
| `duration` | number | `620` | Duration, ms |
| `spin-deg` | number | `90` | Rotation for `spin`, degrees |
| `stagger` | number | `0` | Spread of stroke starts, ms |
| `seq` | number | `0` | Strict queue of strokes, ms per stroke |

Changing any attribute re-renders the icon. Animation respects
`prefers-reduced-motion`.

## The hover target

`animate-on-hover` listens on the **nearest clickable ancestor** — hover the
whole button and the icon inside it animates:

```html
<button>
  <tacet-icon name="trash" animate-on-hover></tacet-icon> Delete
</button>
```

Nothing clickable around? Mark the container with **`data-tacet-hover`** and it
becomes the target. Aiming at a 24px glyph is no fun; a cell or a card is:

```html
<figure class="cell" data-tacet-hover>
  <tacet-icon name="saxophone" size="28" animate-on-hover></tacet-icon>
  <figcaption>saxophone</figcaption>
</figure>
```

With neither a clickable ancestor nor the attribute, the icon listens to itself.

Recognised by default: `button`, `a`, `[role="button"]`, `[role="menuitem"]`,
`[role="tab"]`, `[role="option"]`, `label`, and anything with `data-tacet-hover`.

## Accent colour

```css
:root { --tacet-accent: #2a78d6; }
```

Without the variable the icon is monochrome. Per icon: `accent-color="#c94a17"`.

## Styling from outside

The element draws into **light DOM**, so the markup matches what the React
wrapper produces — an equivalence covered by a test across all 320 glyphs — and
the icon can be styled with ordinary CSS:

```css
tacet-icon { color: var(--ink-2); }
tacet-icon:hover { color: var(--ink); }
```

The stroke uses `currentColor`, so setting `color` is usually all you need.

## In code

```js
import { TacetIconElement, defineTacetIcon, iconNames, hasIcon, reverse } from "tacet-element";

defineTacetIcon("my-icon");      // register under a different tag
document.querySelector("tacet-icon").render();  // force a re-render
reverse(svg);                    // erase the contour back out
```

`iconNames()` and `hasIcon(name)` come from the core and are re-exported for
convenience — handy for building a picker.

## Notes

No dependencies beyond the engine itself; the element is built on the native
Custom Elements API. Importing the package in Node is safe: registration is
skipped where `customElements` does not exist, so server rendering does not
break.

MIT © [Ilya Smurov](https://smurov.com)
