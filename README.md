# Tacet

An outline icon set where the **cut is data, not geometry**.

Every stroke gets `pathLength=100`, and the gaps live as `[start%, width%]` pairs
rendered through `stroke-dasharray`. Moving a cut is editing one number, not
redrawing a path. From that single decision you get the draw-in animation, four
cut densities and a solid mode — out of one source, with no second set of files.

**320 glyphs.** Interface, 64 musical instruments and roles, 19 creative services.

- Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**
- MIT licensed

## Install

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

Not using React:

```bash
npm i tacet-element
```

```html
<script type="module">import "tacet-element";</script>

<tacet-icon name="rocket" size="24"></tacet-icon>
```

## Written for agents

Interfaces are increasingly written by AI agents, and an agent picks an icon by
its name — which is how `trash` ends up where `archive` was meant. Every glyph in
this set carries what it is for, what it gets confused with, and what to take
instead:

```
trash
  use:      Permanent deletion, the item is gone.
  avoid:    If the item is only moved out of sight and can come back,
            that is `archive`. If access is being denied rather than
            data removed, use `ban`.
  synonyms: delete, remove, bin, trash, удалить, корзина, мусор
  related:  archive, ban, x
```

Search tags exist in every icon set. A guide to choosing does not — that is the
part this set adds. It ships three ways: as the `META` export from
`tacet-core`, as [icons.json](https://tacet.smurov.com/icons.json), and as
[llms.txt](https://tacet.smurov.com/llms.txt) for agents to read directly.

Synonyms are bilingual, so search finds `trash` by both "delete" and «удалить».

## Packages

| Package | What for |
|---|---|
| [`tacet`](packages/react) | React component. React stays a peer dependency |
| [`tacet-core`](packages/core) | Data and engine. No dependencies at all |
| [`tacet-element`](packages/element) | `<tacet-icon>` custom element |

Both wrappers are thin: they call `renderSpec()` from the core and know nothing
about geometry. A test compares the DOM they produce across all 320 glyphs, so
they cannot drift apart quietly.

## Static SVG

```bash
pnpm svg
```

Writes 320 standalone SVG files plus a sprite. Cuts survive — they are baked into
`stroke-dasharray`. The animation does not: it lives at runtime and builds a mask
from cloned shapes, which a file has nowhere to get.

## Stroke width

Stroke follows size by a power law rather than proportionally, so a large icon
does not turn into a thick blueprint:

| size | on screen |
|---|---|
| 12px | 1.10 |
| 24px | 1.50 |
| 128px | 3.19 |

Need a constant hairline at any size — pass `absoluteStroke`.

## Accent colour

Accent details are painted with `--tacet-accent`. Without the variable the icon
is monochrome, so the set drops into any palette as is:

```css
:root { --tacet-accent: #2a78d6; }
```

## Development

```bash
pnpm install
pnpm build       # all three packages
pnpm test        # 84 tests
pnpm svg         # static files
pnpm meta        # icons.json and llms.txt
pnpm gallery     # a self-contained gallery page
```

## Licence

MIT © Ilya Smurov
