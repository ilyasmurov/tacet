// tacet-element — <tacet-icon> for projects without React.
//
// Importing the package registers the element on its own: in markup that is
// usually what people expect. Need a different tag — call defineTacetIcon("my-icon").

import { defineTacetIcon } from "./TacetIconElement.js";

export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";

defineTacetIcon();
