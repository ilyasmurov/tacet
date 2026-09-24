# Tacet

An outline icon set where the **cut is data, not geometry**.

Every stroke gets `pathLength=100`, and the gaps live as `[start%, width%]` pairs
rendered through `stroke-dasharray`. Moving a cut is editing one number, not
redrawing a path. From that single decision you get the draw-in animation, four
cut densities and a solid mode — out of one source, with no second set of files.

**454 glyphs.** Interface, ten digits, Latin and Cyrillic capitals with punctuation, 64 musical
instruments and roles, 19 creative services.
Every one of them carries a note on when to use it.

- Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**
- MIT licensed

## Install

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

React Native:

```bash
npm i tacet-native react-native-svg
```

```jsx
import { Icon } from "tacet-native";

<Icon name="rocket" color="#18181b" />
<Icon name="bell" size={20} color="#18181b" replayKey={taps} />
```

There is no cascade on a phone, so the colour is explicit — `currentColor` has
nothing to inherit from. Cuts are converted from percentages into units of the
contour: `pathLength` does not exist in react-native-svg. Of the animation modes
only `draw` is there so far, and it plays on `replayKey`, not on mount.

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
| [`tacet-react`](packages/react) | React components: `Icon`, `Digits`, `Text`, `TextField` and `DigitsField`. React stays a peer dependency |
| [`tacet-native`](packages/native) | React Native component, drawn with react-native-svg |
| [`tacet-core`](packages/core) | Data and engine. No dependencies at all |
| [`tacet-element`](packages/element) | `<tacet-icon>`, `<tacet-digits>`, `<tacet-text>`, `<tacet-text-field>` and `<tacet-digits-field>` custom elements |

The wrappers are thin: they call `renderSpec()` from the core and know nothing
about geometry. A test compares the DOM the web ones produce across all 454
glyphs, so they cannot drift apart quietly.

The React Native one is thin in the same way, but a phone differs in three
places, and each is handled in the wrapper rather than in the set: `pathLength`
does not exist there, so cuts are measured into real units; `currentColor` has no
cascade to inherit from, so the colour is passed in; and `overflow: visible` may
not survive, so at the sharpest glyphs a tip can be clipped — `zoom={false}` is
the way out. Its own tests run all 454 glyphs through the translation.

## Animation

Web wrappers only, so far: React Native has the `draw` mode alone, played on
`replayKey`.

The draw-in comes from the same record as the cuts: the contour draws itself
while the gaps hold their place. Four modes — `draw`, `spin`, `pop`, `fade` — and
every glyph carries its own preset, so `loading` spins and `waveform` staggers
without being told to.

```jsx
<Icon name="bell" animateIn />                  // on mount
<Icon name="bell" animateOnHover />             // on hover
<Icon name="bell" replayKey={count} />          // on demand
```

Hover listens on the **nearest clickable ancestor** — hover a button and the icon
inside it animates. Where there is no button, mark the container with
`data-tacet-hover` and it becomes the target: aiming at a 24px glyph is no fun, a
cell or a card is.

```jsx
<figure className="cell" data-tacet-hover>
  <Icon name="saxophone" size={28} animateOnHover />
</figure>
```

The same works in the custom element (`animate`, `animate-on-hover`) and on bare
DOM through `animate()` / `prepare()` / `reverse()` from the core. Everything
respects `prefers-reduced-motion`.

## Digits

Ten digits, `digit-0` … `digit-9`, each drawn as a single stroke the way a hand
writes it. As icons they behave like any other glyph:

```jsx
<Icon name="digit-7" />
```

A number that changes has a component of its own. Only the digits that changed
move, the ones place first; a number that grows draws its new digits in, one
that shrinks erases the old ones and gives the room back.

```jsx
import { Digits, DigitsField } from "tacet-react";

<Digits value={unread} size={16} />
<Digits value="12:30" transition="relay" />
<DigitsField defaultValue="1" inputMode="numeric" />
```

```html
<tacet-digits value="1248" size="40"></tacet-digits>
<tacet-digits-field name="qty" inputmode="numeric"></tacet-digits-field>
```

Three transitions: `morph`, the default, flows one contour into the other;
`relay` runs the old digit off while the new one draws in; `erase` rewinds the
old digit and writes the new one. A number shows 0–9 and `:`, and its digits sit
on a tabular grid, so a counter does not jiggle as it ticks.

`DigitsField` is the letters' `TextField` with digits: the same real `<input>`
inside, the same caret and selection. The input keeps the digits and the colon
only, and whatever else is typed or pasted is taken out at once. A digit that
gives way to a digit turns into it by the field's transition; a digit that goes
erases where it stands, and only then the rest moves up. For a phone keypad set
`inputmode="numeric"` — it has no colon, so a time needs the full keyboard.

The accent of a digit is a stretch of its contour — `accentSpans`, the same
`[start%, width%]` pairs as cuts — painted in variants C and D.

React Native has the digit glyphs, accent included. The animated number and the
field are web only for now.

## Letters

Latin and Cyrillic capitals — `latin-a` … `latin-z`, and `cyrillic-a` …
`cyrillic-ya` by their Unicode names — with the punctuation of a line,
`mark-period` … `mark-ellipsis`. Each letter is drawn in pen strokes, in the
order a hand writes it, and draws itself in that order. As icons they behave
like any other glyph:

```jsx
<Icon name="cyrillic-ze" />
```

A line of text has a component of its own. Widths are proportional and the
kerning is measured from the outlines. When the text changes, the common start
and end stay put, what changed erases back along its strokes, and the new part
writes itself in.

```jsx
import { Text, TextField } from "tacet-react";

<Text value="Сохранено" size={24} />
<TextField defaultValue="Привет" placeholder="Name" />
```

```html
<tacet-text value="10:30 — «TACET»" size="32"></tacet-text>
<tacet-text-field name="title" placeholder="Title"></tacet-text-field>
```

A line is set in capitals: a straight quote turns into a guillemet, an
apostrophe into ’, and a character the set has no glyph for is dropped. Three
transitions: `erase`, the default; `append`, which drops the old part at once
and writes the new one; `rewrite`, which writes the whole line anew. Between two
digits a colon stands centred, the way a clock has it.

`TextField` draws what is typed in the same letters. A real `<input>` sits
inside and keeps the focus, the caret, the selection, copy and paste and its
place in a form; without scripts the field is a plain input. The caret is a
stroke in the accent colour, a selection is a plate of the accent. What was
deleted erases where it stands, then the rest of the line moves up, then the new
letters write themselves in.

React Native has the letter glyphs; the line and the field are web only for now.

## Static SVG

```bash
pnpm svg
```

Writes 454 standalone SVG files plus a sprite. Cuts survive — they are baked into
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
pnpm build       # all four packages
pnpm test        # the whole suite
pnpm svg         # static files
pnpm meta        # icons.json and llms.txt
pnpm gallery     # a self-contained gallery page
```

## Licence

MIT © Ilya Smurov
