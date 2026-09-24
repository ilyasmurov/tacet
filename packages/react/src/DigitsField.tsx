// A field for numbers, drawn in the Tacet digits, for React — TextField's twin
// on the same box, input and mounting (field.tsx). The input keeps the digits
// and the colon only, whatever is typed or pasted.

import { forwardRef } from "react";
import { createDigitsField, type DigitsTransition } from "tacet-core";
import { useField, type FieldProps } from "./field.js";

export interface DigitsFieldProps extends FieldProps {
  /** How a digit turns into another. Defaults to "morph". */
  transition?: DigitsTransition | undefined;
}

export const DigitsField = forwardRef<HTMLInputElement, DigitsFieldProps>(function DigitsField(
  { size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, className, style, ...inputProps },
  ref,
) {
  const { field, input } = useField(
    createDigitsField,
    { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition },
    [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition],
    ref,
  );
  return (
    <span ref={field} className={className} style={style}>
      <input ref={input} {...inputProps} />
    </span>
  );
});
