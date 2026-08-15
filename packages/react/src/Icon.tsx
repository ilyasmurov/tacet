// React-обёртка над @tacet/core. Геометрии не знает: зовёт renderSpec и animate.
// Внутри — только то, что действительно про React: ref, id, замер размера, эффекты.

import {
  useEffect, useId, useLayoutEffect, useRef, useState, forwardRef,
  type SVGProps, type MutableRefObject,
} from "react";
import {
  renderSpec, animate, prepare, reverse, resolveAnimateCfg, canAnimateOnMount, toReactAttrs,
  type IconVariant, type AnimMode, type ElementSpec,
} from "@tacet/core";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Имя глифа, например "rocket" или "guitar-electric". */
  name: string;
  /** Размер в пикселях. По умолчанию 24. */
  size?: number | undefined;
  /** A — один разрез · B — все · C — один и акцент · D — все и акцент. По умолчанию D. */
  variant?: IconVariant | undefined;
  /** Цельный контур: разрезы не рисуются. */
  solid?: boolean | undefined;
  /** Толщина штриха на экране, в пикселях. Задана — размер на неё не влияет. */
  strokeWidth?: number | undefined;
  /** Толщина не растёт с размером. */
  absoluteStroke?: boolean | undefined;
  /** Оптический зум. Выключай, если фактический размер неизвестен. */
  zoom?: boolean | undefined;
  /** Цвет акцентных деталей. По умолчанию — переменная --tacet-accent. */
  accentColor?: string | undefined;
  /** Проиграть появление при монтировании. */
  animateIn?: boolean | undefined;
  /** Проиграть появление при наведении на ближайший кликабельный элемент. */
  animateOnHover?: boolean | undefined;
  /** Смена значения повторяет анимацию. */
  replayKey?: number | string | undefined;
  /** Задержка до старта анимации, мс. */
  animationDelay?: number | undefined;
  /** Перебить пресет анимации глифа. */
  animationMode?: AnimMode | undefined;
  duration?: number | undefined;
  spinDeg?: number | undefined;
  stagger?: number | undefined;
  seq?: number | undefined;
  /** Подпись для скринридера. Без неё иконка скрыта как декоративная. */
  title?: string | undefined;
}

const HOST_SELECTOR =
  'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"], label';

// Ядро отдаёт канонические имена из спецификации SVG (stroke-width). Разметку
// React с ними рисует верно, но в dev-режиме ругается на каждый — поэтому
// переводим в его написание. Итоговый DOM от этого не меняется.
function asSvgProps<T>(attrs: Record<string, string | number>): SVGProps<T> {
  return toReactAttrs(attrs) as unknown as SVGProps<T>;
}

function renderElements(parts: ElementSpec[]) {
  return parts.map((part, i) => {
    const key = "p" + i;
    if (part.tag === "circle") return <circle key={key} {...asSvgProps<SVGCircleElement>(part.attrs)} />;
    if (part.tag === "rect") return <rect key={key} {...asSvgProps<SVGRectElement>(part.attrs)} />;
    return <path key={key} {...asSvgProps<SVGPathElement>(part.attrs)} />;
  });
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    name, size = 24, variant, solid, strokeWidth, absoluteStroke, zoom = true, accentColor,
    animateIn = false, animateOnHover = false, replayKey, animationDelay,
    animationMode, duration, spinDeg, stagger, seq, title, style, ...rest
  },
  forwardedRef,
) {
  const innerRef = useRef<SVGSVGElement | null>(null);
  const setRef = (el: SVGSVGElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as MutableRefObject<SVGSVGElement | null>).current = el;
  };

  // Иконку нередко сжимает CSS-класс при дефолтных атрибутах 24 — тогда штрих,
  // посчитанный от 24, после сжатия превращается в нитку. Меряем фактическую
  // ширину и считаем от неё. clientWidth не зависит от transform, поэтому
  // анимации spin и pop замер не сбивают.
  const [measured, setMeasured] = useState<number | null>(null);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth || el.getBoundingClientRect().width;
      if (!width) return;
      setMeasured((prev) => {
        const base = prev ?? sizeRef.current;
        return Math.abs(base - width) < 0.5 ? prev : Math.round(width);
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const uid = useId().replace(/:/g, "");
  const effSize = measured ?? size;
  const spec = renderSpec(name, {
    size: effSize, variant, solid, strokeWidth, absoluteStroke, zoom, accentColor,
    idSuffix: uid,
  });

  const cfg = resolveAnimateCfg(name, {
    mode: animationMode, duration, spinDeg, stagger, seq, delay: animationDelay,
  });

  // Прячем до первой отрисовки, иначе кадр мигнёт готовой картинкой.
  useLayoutEffect(() => {
    if (!animateIn || !innerRef.current) return;
    prepare(innerRef.current, cfg);
    // Пересобирать эффект на каждое изменение cfg не нужно: важен только момент
    // появления и смена глифа.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateIn]);

  useEffect(() => {
    if (!animateIn || !innerRef.current) return;
    const svg = innerRef.current;
    const raf = requestAnimationFrame(() => animate(svg, cfg));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateIn, replayKey]);

  // Реплей по наведению — только внутри кликабельного элемента: наводишь на
  // кнопку целиком, анимируется иконка. Декоративные иконки от ховера молчат.
  useEffect(() => {
    if (!animateOnHover) return;
    const svg = innerRef.current;
    if (!svg) return;
    const host = svg.closest(HOST_SELECTOR);
    if (!host) return;
    const onEnter = () => animate(svg, cfg);
    host.addEventListener("mouseenter", onEnter);
    return () => host.removeEventListener("mouseenter", onEnter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateOnHover]);

  if (!spec) {
    if (typeof console !== "undefined") console.warn(`tacet: неизвестная иконка "${name}"`);
    return null;
  }

  return (
    <svg
      ref={setRef}
      {...asSvgProps<SVGSVGElement>(spec.svgAttrs)}
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ overflow: "visible", ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {spec.mask ? (
        <mask {...asSvgProps<SVGMaskElement>(spec.mask.attrs)}>{renderElements(spec.mask.children)}</mask>
      ) : null}
      <g className="tc-body">{renderElements(spec.parts)}</g>
    </svg>
  );
});

export { canAnimateOnMount, reverse };
export type { IconVariant, AnimMode };
