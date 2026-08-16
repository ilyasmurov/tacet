# tacet-element

`<tacet-icon>` — the Tacet icon set for projects without React. 320 outline
glyphs where the cut is data, not geometry.

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
<tacet-icon name="status-done" solid label="Готово"></tacet-icon>
```

## Attributes

| Attribute | What it does |
|---|---|
| `name` | Glyph name |
| `size` | Pixels, default 24 |
| `variant` | `A` · `B` · `C` · `D` |
| `solid` | Solid contour |
| `stroke-width` | Stroke on screen, in pixels |
| `absolute-stroke` | Stroke stops following size |
| `zoom` | Optical zoom, on by default |
| `accent-color` | Colour of accent details |
| `animate` | Play the draw-in when connected |
| `animate-on-hover` | Replay on hovering the nearest clickable ancestor |
| `label` | Accessible label. Without it the icon is `aria-hidden` |

Changing an attribute re-renders the icon.

The element draws into light DOM, so the markup matches what the React wrapper
produces — that equivalence is covered by a test across all 320 glyphs — and the
icon can be styled from outside with ordinary CSS.

## Accent colour

```css
:root { --tacet-accent: #2a78d6; }
```

Without the variable the icon is monochrome.

## Own tag name

```js
import { defineTacetIcon } from "tacet-element";
defineTacetIcon("my-icon");
```

MIT © Ilya Smurov
