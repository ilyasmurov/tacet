// What the two fields share on the React side: the box people see with a real
// <input> inside, and a controller from tacet-core mounted over them. The text
// field and the digits field differ only in the controller they mount.
//
// A real <input> keeps the focus, the caret, the selection, copy and paste, and
// its place in a form. The controller draws the glyphs, the caret and the
// selection over it once mounted — before that, and without scripts at all, the
// field is a plain working input. `className` and `style` go to the field, the
// box people see; every other prop goes to the input, and so does the ref.

import {
  useEffect, useImperativeHandle, useLayoutEffect, useRef,
  type CSSProperties, type DependencyList, type ForwardedRef, type InputHTMLAttributes, type MutableRefObject,
} from "react";
import type { IconVariant } from "tacet-core";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "style"> {
  /** Height of the glyphs in pixels, the same `size` an Icon takes. Defaults to 24. */
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
  /** Class of the field — the box around the glyphs. */
  className?: string | undefined;
  /** Style of the field — the box around the glyphs. */
  style?: CSSProperties | undefined;
}

/** What createTextField and createDigitsField give. */
interface Controller<O> {
  refresh(): void;
  update(opts: O): void;
  destroy(): void;
}

// useLayoutEffect warns during server rendering, and on the server there is
// nothing to take over anyway.
const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Mounts `create` over the field once; later options go to update() when one
 * of `optionDeps` changes, later values to refresh() after every render.
 * Returns the refs for the field and its input.
 */
export function useField<O>(
  create: (field: HTMLElement, opts: O) => Controller<O>,
  opts: O,
  optionDeps: DependencyList,
  ref: ForwardedRef<HTMLInputElement>,
): { field: MutableRefObject<HTMLSpanElement | null>; input: MutableRefObject<HTMLInputElement | null> } {
  const field = useRef<HTMLSpanElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const controller = useRef<Controller<O> | null>(null);
  const latest = useRef(opts);
  latest.current = opts;

  useImperativeHandle(ref, () => input.current!, []);

  useMountEffect(() => {
    if (!field.current) return;
    const control = create(field.current, latest.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, optionDeps);

  // A controlled value is written into the input by React without an input
  // event; after every render the field draws whatever the input now holds.
  useEffect(() => {
    controller.current?.refresh();
  });

  return { field, input };
}
