// Markup strings for server rendering, shared by the number and the text
// layouts: attributes escaped once, the same way for both.

import type { ElementSpec } from "./renderSpec.js";

const escapeAttr = (value: string | number) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** `key="value"` pairs for an opening tag. */
export const attrString = (attrs: Record<string, string | number>) =>
  Object.keys(attrs).map((key) => `${key}="${escapeAttr(attrs[key]!)}"`).join(" ");

/** One element with no children. */
export const elementMarkup = (el: ElementSpec) => `<${el.tag} ${attrString(el.attrs)}></${el.tag}>`;
