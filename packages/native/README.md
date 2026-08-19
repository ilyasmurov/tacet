# tacet-native

React Native component for the Tacet icon set — 320 outline glyphs where the
**cut is data, not geometry**.

Gallery and docs: **[tacet.smurov.com](https://tacet.smurov.com)**

```bash
npm i tacet-native react-native-svg
```

```jsx
import { Icon } from "tacet-native";

<Icon name="rocket" color="#18181b" />
<Icon name="bell" size={20} color="#18181b" />
<Icon name="saxophone" size={32} color="#18181b" variant="A" />
<Icon name="status-done" solid color="#16a34a" title="Done" />
```

On the web take [`tacet-react`](https://www.npmjs.com/package/tacet-react),
[`tacet-element`](https://www.npmjs.com/package/tacet-element) (a custom element)
or [`tacet-core`](https://www.npmjs.com/package/tacet-core) (the engine on its own).

## Props

| Prop | What for |
|---|---|
| `name` | Glyph name, for example `"rocket"` |
| `size` | Pixels. Defaults to 24 |
| `color` | Colour of the glyph. Explicit — there is no cascade to inherit from |
| `accentColor` | Colour of accent details. Defaults to `color`, making the icon monochrome |
| `variant` | `A` one cut · `B` all · `C` one and accent · `D` all and accent. Defaults to `D` |
| `solid` | Solid contour: cuts are not drawn |
| `strokeWidth` | Stroke width on screen, in pixels. Once set, size does not affect it |
| `zoom` | Optical zoom. On by default |
| `replayKey` | Changing the value draws the glyph again |
| `title` | Label for screen readers. Without it the icon is hidden as decorative |

## How a phone differs

The package is a thin wrapper: it calls `renderSpec()` from `tacet-core` and
knows nothing about geometry. But three things about the web do not exist in
React Native, and each is resolved here rather than in the set.

**`pathLength` is not supported.** The set describes cuts as shares of the
contour length, which on the web works through `pathLength={100}`. Here the real
length is measured — by formula for a circle and a rectangle, with
[svg-path-properties](https://www.npmjs.com/package/svg-path-properties) for an
arbitrary path — and the shares are turned into units. Measurements are cached
per path.

**`currentColor` has nothing to inherit from.** The colour comes in as a prop.

**`overflow: visible` may not survive.** Optical zoom trims the viewBox, and the
sharpest glyphs reach past it — a map pin by about a pixel and a half at 24px.
iOS honours the style the component sets; Android clips by the view bounds
regardless, so pass `zoom={false}` there if you see a shaved tip.

## Animation

Changing `replayKey` draws the glyph again: the contour appears from start to
end over 620 ms.

It is uncovered by a mask rather than by its own dash — otherwise the animation
would fight the cuts over the same attribute, and the gaps would crawl along the
path instead of holding their place. Fills and tiny rings have no length to draw
along, so they are uncovered whole, together with the strokes.

The entrance is not played on mount on purpose: a list holds dozens of icons and
they would all draw themselves at once, on the very scroll where the animation
cannot be seen. On a button press it costs one icon and half a second.

Of the modes the set describes only `draw` is implemented here — `spin`, `pop`
and `fade`, along with the per-glyph presets from `ANIM` and the `stagger`/`seq`
timings, remain web-only for now.

MIT
