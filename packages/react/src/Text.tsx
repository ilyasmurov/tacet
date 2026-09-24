// A line of text in the Tacet capitals, for React. The component renders the
// still text as markup — on the server as well, so the letters are there before
// any script — and once mounted hands the DOM to the controller from
// tacet-core. From then on React leaves the letters alone: new text goes
// through set(), not through a re-render that would fight the animation for
// the same nodes.

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import {
  createText, textMarkup,
  type IconVariant, type TextController, type TextOptions, type TextTransition,
} from "tacet-core";

export interface TextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "dangerouslySetInnerHTML"> {
  /** What to show. Set in capitals; characters the set cannot draw are dropped with a warning. */
  value: string | number;
  /** Height in pixels, the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Colour of the accents. Defaults to the --tacet-accent variable. */
  accentColor?: string | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Stroke stops following size. */
  absoluteStroke?: boolean | undefined;
  /** How the text changes. Defaults to "erase": the changed middle erases, the new one writes itself in. */
  transition?: TextTransition | undefined;
  /** Label for screen readers. Defaults to the value as given, in its own case. */
  title?: string | undefined;
}

// useLayoutEffect warns during server rendering, and on the server there is
// nothing to take over anyway.
const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Text({
  value, size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, title, style, ...rest
}: TextProps) {
  const text = String(value);
  const host = useRef<HTMLSpanElement | null>(null);
  const controller = useRef<TextController | null>(null);
  const opts: TextOptions = { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition };
  const latest = useRef(opts);
  latest.current = opts;

  // Computed once. React compares the string by value and, as long as it stays
  // the same, never touches what the controller has done to the DOM since.
  const [markup] = useState(() => textMarkup(text, opts));

  useMountEffect(() => {
    if (!host.current) return;
    const line = createText(host.current, text, latest.current);
    controller.current = line;
    return () => {
      line.destroy();
      controller.current = null;
    };
    // Mount only: later text and options go through set() and update().
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
      // Lines stack at the height of the glyphs; words wrap like text.
      style={{ display: "inline-block", lineHeight: 0, ...style }}
      {...rest}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
