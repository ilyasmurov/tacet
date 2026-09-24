// A text field that draws what is typed in the Tacet capitals, for React.
//
// A real <input> sits inside: it keeps the focus, the caret, the selection,
// copy and paste, and its place in a form. The controller from tacet-core draws
// the letters, the caret and the selection over it once mounted — before that,
// and without scripts at all, the field is a plain working input.
//
// `className` and `style` go to the field, the box people see; every other prop
// goes to the input, and so does the ref.

import {
  forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type InputHTMLAttributes,
} from "react";
import {
  createTextField,
  type IconVariant, type TextFieldController, type TextOptions, type TextTransition,
} from "tacet-core";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "style"> {
  /** Height of the letters in pixels, the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Colour of the accents, the caret and the selection. Defaults to the --tacet-accent variable. */
  accentColor?: string | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Stroke stops following size. */
  absoluteStroke?: boolean | undefined;
  /** How the text changes as it is typed. Defaults to "erase". */
  transition?: TextTransition | undefined;
  /** Class of the field — the box around the letters. */
  className?: string | undefined;
  /** Style of the field — the box around the letters. */
  style?: CSSProperties | undefined;
}

// useLayoutEffect warns during server rendering, and on the server there is
// nothing to take over anyway.
const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, className, style, ...inputProps },
  ref,
) {
  const field = useRef<HTMLSpanElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const controller = useRef<TextFieldController | null>(null);
  const opts: TextOptions = { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition };
  const latest = useRef(opts);
  latest.current = opts;

  useImperativeHandle(ref, () => input.current!, []);

  useMountEffect(() => {
    if (!field.current) return;
    const control = createTextField(field.current, latest.current);
    controller.current = control;
    return () => {
      control.destroy();
      controller.current = null;
    };
    // Mount only: later options go through update(), later values through refresh().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller.current?.update(latest.current);
  }, [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition]);

  // A controlled value is written into the input by React without an input
  // event; after every render the field draws whatever the input now holds.
  useEffect(() => {
    controller.current?.refresh();
  });

  return (
    <span ref={field} className={className} style={style}>
      <input ref={input} {...inputProps} />
    </span>
  );
});
