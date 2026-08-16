# tacet

React component for the Tacet icon set — 320 outline glyphs where the **cut is
data, not geometry**.

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet
```

```jsx
import { Icon } from "tacet";

<Icon name="rocket" />
<Icon name="bell" size={20} animateIn />
<Icon name="saxophone" size={32} variant="A" />
<Icon name="status-done" solid title="Done" />
```

## Props

| Prop | What it does |
|---|---|
| `name` | Glyph name. Typed: a wrong name is a compile error |
| `size` | Pixels, default 24 |
| `variant` | `A` one cut · `B` all cuts · `C` one cut and accent · `D` all and accent |
| `solid` | Solid contour, cuts are not drawn |
| `strokeWidth` | Stroke on screen, in pixels |
| `absoluteStroke` | Stroke stops following size |
| `animateIn` | Play the draw-in on mount |
| `animateOnHover` | Replay on hovering the nearest clickable ancestor |
| `replayKey` | Change the value to replay on demand |
| `title` | Accessible label. Without it the icon is `aria-hidden` |
| `accentColor` | Colour of accent details |

Anything else is forwarded to the `<svg>`.

## Accent colour

Accent details use `--tacet-accent`. Without the variable the icon is monochrome:

```css
:root { --tacet-accent: #2a78d6; }
```

## Choosing a glyph

Every glyph carries a note on what it is for and what it gets confused with —
useful when the code is written by an agent that picks icons by name:

```js
import { META } from "@tacet/core";

META["trash"].use;    // "Permanent deletion, the item is gone."
META["trash"].avoid;  // "If the item is only moved out of sight … that is `archive` …"
```

Same data as [icons.json](https://tacet.smurov.com/icons.json) and
[llms.txt](https://tacet.smurov.com/llms.txt).

## Notes

React is a peer dependency: the package pulls nothing into your tree. Stroke
follows size by a power law, so large icons stay light — 128px gives 3.19px
instead of the 7.2px a proportional rule would.

MIT © Ilya Smurov
