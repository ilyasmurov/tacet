// Translating SVG attribute names into the spelling React expects.
//
// renderSpec emits the canonical names from the SVG specification
// (`stroke-width`) — those are what setAttribute takes, and what static SVG
// files ship with. React renders markup with them correctly, but in dev mode it
// prints "Invalid DOM property" for every one. Four warnings per icon means
// somebody else's console filled with our package, so for React we translate.
//
// Attributes that are already spelled solid in SVG (`pathLength`, `maskUnits`)
// and anything `data-*` / `aria-*` React takes as is — they are not listed here.

const REACT_ATTR_NAMES: Record<string, string> = {
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "stroke-miterlimit": "strokeMiterlimit",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "vector-effect": "vectorEffect",
  "shape-rendering": "shapeRendering",
};

/** Attribute name in React spelling. Unknown ones come back unchanged. */
export function toReactAttrName(name: string): string {
  return REACT_ATTR_NAMES[name] ?? name;
}

/** A set of attributes translated for React. */
export function toReactAttrs(
  attrs: Record<string, string | number>,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const key of Object.keys(attrs)) {
    out[toReactAttrName(key)] = attrs[key]!;
  }
  return out;
}
