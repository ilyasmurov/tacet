// Перевод SVG-атрибутов в написание, которое ждёт React.
//
// renderSpec отдаёт канонические имена из спецификации SVG (`stroke-width`) —
// их принимает setAttribute, с ними же уходят статические SVG-файлы. React
// разметку с ними рисует правильно, но в dev-режиме печатает на каждый такой
// атрибут «Invalid DOM property». Четыре предупреждения на иконку — это чужая
// консоль, забитая нашим пакетом, поэтому для React переводим.
//
// Атрибуты, которые в SVG и так пишутся слитно (`pathLength`, `maskUnits`),
// и любые `data-*` / `aria-*` React принимает как есть — их здесь нет.

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

/** Имя атрибута в написании React. Незнакомое возвращается без изменений. */
export function toReactAttrName(name: string): string {
  return REACT_ATTR_NAMES[name] ?? name;
}

/** Набор атрибутов, переведённый для React. */
export function toReactAttrs(
  attrs: Record<string, string | number>,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const key of Object.keys(attrs)) {
    out[toReactAttrName(key)] = attrs[key]!;
  }
  return out;
}
