// A number that changes, for React. The component renders the still number as
// markup — on the server as well, so the digits are there before any script —
// and once mounted hands the DOM to the controller from tacet-core. From then
// on React leaves the digits alone: new values go through set(), not through a
// re-render that would fight the animation for the same nodes.

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import {
  createDigits, digitsMarkup,
  type DigitsController, type DigitsOptions, type DigitsTransition, type IconVariant,
} from "tacet-core";

export interface DigitsProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "dangerouslySetInnerHTML"> {
  /** What to show: digits and ":". Anything else is dropped with a warning. */
  value: string | number;
  /** Height in pixels, the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Colour of the accent spans. Defaults to the --tacet-accent variable. */
  accentColor?: string | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Stroke stops following size. */
  absoluteStroke?: boolean | undefined;
  /** How one digit turns into another. Defaults to "morph". */
  transition?: DigitsTransition | undefined;
  /** Label for screen readers. Defaults to the value itself. */
  title?: string | undefined;
}

// useLayoutEffect warns during server rendering, and on the server there is
// nothing to take over anyway.
const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Digits({
  value, size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, title, style, ...rest
}: DigitsProps) {
  const text = String(value);
  const host = useRef<HTMLSpanElement | null>(null);
  const controller = useRef<DigitsController | null>(null);
  const opts: DigitsOptions = { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition };
  const latest = useRef(opts);
  latest.current = opts;

  // Computed once. React compares the string by value and, as long as it stays
  // the same, never touches what the controller has done to the DOM since.
  const [markup] = useState(() => digitsMarkup(text, opts));

  useMountEffect(() => {
    if (!host.current) return;
    const digits = createDigits(host.current, text, latest.current);
    controller.current = digits;
    return () => {
      digits.destroy();
      controller.current = null;
    };
    // Mount only: later values and options go through set() and update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller.current?.update(latest.current);
  }, [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition]);

  useEffect(() => {
    controller.current?.set(text);
  }, [text]);

  return (
    <span
      ref={host}
      role="img"
      aria-label={title ?? text}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
      {...rest}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
