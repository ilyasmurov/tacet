# tacet-react

React component for the Tacet icon set — 320 outline glyphs where the **cut is
data, not geometry**.

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet-react
```

```jsx
import { Icon } from "tacet-react";

<Icon name="rocket" />
<Icon name="bell" size={20} animateIn />
<Icon name="saxophone" size={32} variant="A" />
<Icon name="status-done" solid title="Done" />
```

Not using React? Take [`tacet-element`](https://www.npmjs.com/package/tacet-element)
(a custom element) or [`tacet-core`](https://www.npmjs.com/package/tacet-core)
(the engine on its own).

## Props

### Appearance

| Prop | Type | Default | What it does |
|---|---|---|---|
| `name` | `IconName` | — | Glyph name. Typed: a wrong name is a compile error |
| `size` | `number` | `24` | Size in pixels, used for width and height |
| `variant` | `"A"｜"B"｜"C"｜"D"` | `"D"` | A — one cut · B — all cuts · C — one cut and accent · D — all and accent |
| `solid` | `boolean` | per glyph | Solid contour: cuts are not drawn. Some glyphs are solid by default — status marks, for instance |
| `strokeWidth` | `number` | — | Stroke width **on screen**, in pixels. Once set, size no longer affects it |
| `absoluteStroke` | `boolean` | `false` | Stroke stops following size: 1.5px at any size |
| `zoom` | `boolean` | `true` | Optical zoom. Turn it off when the actual size is unknown |
| `accentColor` | `string` | `var(--tacet-accent, currentColor)` | Colour of accent details |
| `title` | `string` | — | Accessible label. Without it the icon is `aria-hidden` |

Anything else — `className`, `onClick`, `style`, `data-*` — goes straight to the
`<svg>`.

### Animation

| Prop | Type | Default | What it does |
|---|---|---|---|
| `animateIn` | `boolean` | `false` | Play the draw-in on mount |
| `animateOnHover` | `boolean` | `false` | Replay on hover — see the hover target below |
| `replayKey` | `number｜string` | — | Change the value to replay on demand |
| `animationDelay` | `number` | `0` | Delay before the start, ms |
| `animationMode` | `"draw"｜"spin"｜"pop"｜"fade"` | per glyph | Override the glyph's preset |
| `duration` | `number` | `620` | Duration, ms |
| `spinDeg` | `number` | `90` | Rotation for `spin`, degrees |
| `stagger` | `number` | `0` | Spread of stroke starts, ms: the contour assembles out of order |
| `seq` | `number` | `0` | Strict queue of strokes, ms per stroke |

Every glyph carries its own preset — `loading` spins, `waveform` staggers. The
props above override it.

Animation respects `prefers-reduced-motion`: with the preference on, nothing
moves at all.

## The hover target

`animateOnHover` listens on the **nearest clickable ancestor** — hover the whole
button and the icon inside it animates:

```jsx
<button>
  <Icon name="trash" animateOnHover /> Delete
</button>
```

Nothing clickable around? Mark the container with **`data-tacet-hover`** and it
becomes the target. Aiming at a 24px glyph is no fun; a cell or a card is:

```jsx
<figure className="cell" data-tacet-hover>
  <Icon name="saxophone" size={28} animateOnHover />
  <figcaption>saxophone</figcaption>
</figure>
```

With neither a clickable ancestor nor the attribute, the icon listens to itself —
`animateOnHover` is an explicit request, so it is never silently ignored.

Recognised by default: `button`, `a`, `[role="button"]`, `[role="menuitem"]`,
`[role="tab"]`, `[role="option"]`, `label`, and anything with `data-tacet-hover`.

## Accent colour

Accent details use `--tacet-accent`. Without the variable the icon is monochrome,
so the set drops into any palette as is:

```css
:root { --tacet-accent: #2a78d6; }
```

Per icon: `<Icon name="bell" accentColor="#c94a17" />`.

## Stroke width

Stroke follows size by a power law rather than proportionally, so a large icon
does not turn into a heavy blueprint:

| size | on screen |
|---|---|
| 12px | 1.10 |
| 24px | 1.50 |
| 48px | 2.05 |
| 128px | 3.19 |

Need a constant hairline at any size — pass `absoluteStroke`. Need an exact
value — pass `strokeWidth`, given in screen pixels.

The component also measures its **actual** width: icons often get shrunk by a CSS
class while the props stay at the default 24, and a stroke computed for 24 would
become a thread after the shrink.

## Choosing a glyph

Every glyph carries a note on what it is for and what it gets confused with —
useful when the code is written by an agent that picks icons by name:

```js
import { META, searchIcons, iconNames } from "tacet-core";

META["trash"].use;     // "Permanent deletion, the item is gone."
META["trash"].avoid;   // "If the item is only moved out of sight … that is `archive` …"
META["trash"].related; // ["archive", "ban", "x"]

searchIcons("удалить", iconNames()); // ["trash", …] — synonyms are bilingual
```

Same data as [icons.json](https://tacet.smurov.com/icons.json) and
[llms.txt](https://tacet.smurov.com/llms.txt).

## Also exported

```js
import { Icon, TacetIcon, reverse, canAnimateOnMount } from "tacet-react";
```

- `TacetIcon` — the same component under a longer name, for projects that
  already have an `Icon` of their own
- `reverse(svg)` — erase the contour back out, for loaders and for icons leaving
  the screen. The next play brings it back
- `canAnimateOnMount(matches)` — whether the entrance is worth playing on this
  device. On a phone icons appear during scrolling: the animation is barely seen
  and costs a lot — on a bench of 360 icons it measured 1718 ms against 857 ms

```jsx
const animate = canAnimateOnMount(window.matchMedia.bind(window));
<Icon name="rocket" animateIn={animate} />
```

## Notes

React is a peer dependency: the package pulls nothing into your tree. The engine
lives in `tacet-core` and knows nothing about React — the component is a thin
wrapper that calls it.

MIT © [Ilya Smurov](https://smurov.com)
