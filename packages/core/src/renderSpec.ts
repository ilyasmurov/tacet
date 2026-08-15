// «Имя глифа → готовые атрибуты SVG». Чистая функция: ни DOM, ни React.
// На неё опираются обе обёртки, поэтому движок в наборе ровно один.

import { ICONS, SOLID_BY_DEFAULT, type IconDef, type IconName, type Part } from "./data.js";
import { dashFor, insetFor, strokeOnScreen, type StrokeOpts } from "./stroke.js";

/** A — один разрез · B — все разрезы · C — один разрез и акцент · D — все разрезы и акцент. */
export type IconVariant = "A" | "B" | "C" | "D";

/** Цвет акцентных деталей. Без переменной иконка монохромная. */
export const ACCENT_VAR = "var(--tacet-accent, currentColor)";

export interface RenderOpts extends StrokeOpts {
  /** Размер в пикселях, он же ширина и высота. По умолчанию 24. */
  size?: number | undefined;
  /** По умолчанию D. */
  variant?: IconVariant | undefined;
  /** Цельный контур: разрезы игнорируются, данные `gaps` при этом не меняются. */
  solid?: boolean | undefined;
  /** Оптический зум. Выключай, когда фактический размер неизвестен. По умолчанию включён. */
  zoom?: boolean | undefined;
  /** Чем красить акцентные детали. По умолчанию — переменная `--tacet-accent`. */
  accentColor?: string | undefined;
  /** Уникальный хвост для id масок. Обязателен, если на странице несколько иконок с вырезом. */
  idSuffix?: string | undefined;
}

export interface ElementSpec {
  tag: "path" | "circle" | "rect";
  attrs: Record<string, string | number>;
}

export interface MaskSpec {
  id: string;
  attrs: Record<string, string | number>;
  children: ElementSpec[];
}

export interface RenderResult {
  /** Атрибуты корневого `<svg>`, кроме обработчиков и стилей. */
  svgAttrs: Record<string, string | number>;
  /** Маска-вырез, если у глифа есть части типа `hole`. */
  mask: MaskSpec | null;
  /** Тело глифа. Кладётся в `<g class="tc-body">` — по нему работает анимация. */
  parts: ElementSpec[];
  /** Значение атрибута `stroke-width`, в единицах viewBox. */
  strokeWidth: number;
  /** Та же толщина, но в CSS-пикселях на экране. */
  strokeOnScreen: number;
}

function isSolid(name: string, solid: boolean | undefined): boolean {
  if (solid != null) return solid;
  return SOLID_BY_DEFAULT.includes(name);
}

function colorFor(part: Part, variant: IconVariant, accent: string): string {
  if (part.col) return part.col;
  const accentOn = (variant === "C" || variant === "D") && part.accent;
  return accentOn ? accent : "currentColor";
}

function shapeAttrs(part: Part): { tag: ElementSpec["tag"]; attrs: Record<string, string | number> } {
  if (part.t === "circle") {
    return { tag: "circle", attrs: { cx: part.cx!, cy: part.cy!, r: part.r! } };
  }
  if (part.t === "rect") {
    return { tag: "rect", attrs: { x: part.x!, y: part.y!, width: part.w!, height: part.h!, rx: part.rx! } };
  }
  return { tag: "path", attrs: { d: part.d! } };
}

function buildHoleMask(def: IconDef, id: string): MaskSpec | null {
  const holes = def.filter((p): p is Part => !!p && p.t === "hole");
  if (!holes.length) return null;

  const children: ElementSpec[] = [
    { tag: "rect", attrs: { x: 0, y: 0, width: 24, height: 24, fill: "#fff", "data-mk": "1" } },
  ];
  for (const hole of holes) {
    if (hole.d) {
      children.push({
        tag: "path",
        attrs: {
          d: hole.d, fill: "none", stroke: "#000", "stroke-width": hole.sw ?? 2.2,
          "stroke-linecap": "round", "stroke-linejoin": "round", "data-mk": "1",
        },
      });
    } else {
      children.push({
        tag: "circle",
        attrs: { cx: hole.cx!, cy: hole.cy!, r: hole.r!, fill: "#000", "data-mk": "1" },
      });
    }
  }
  return {
    id,
    attrs: { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 24, height: 24 },
    children,
  };
}

/** Есть ли такой глиф в наборе. */
export function hasIcon(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}

/** Все имена набора, в порядке объявления. */
export function iconNames(): string[] {
  return Object.keys(ICONS);
}

export function renderSpec(name: string, opts: RenderOpts = {}): RenderResult | null {
  const def = ICONS[name] as IconDef | undefined;
  if (!def) return null;

  const size = opts.size ?? 24;
  const variant = opts.variant ?? "D";
  const accent = opts.accentColor ?? ACCENT_VAR;
  const solid = isSolid(name, opts.solid);
  const zoom = opts.zoom ?? true;

  const inset = zoom ? insetFor(size) : 0;
  const visible = 24 - 2 * inset;
  const onScreen = strokeOnScreen(size, opts);
  // Атрибут задаётся в единицах viewBox, а на экране всё умножается на size/visible.
  // Отсюда обратный пересчёт — тогда экранная толщина равна ровно onScreen.
  const strokeWidth = (onScreen * visible) / size;

  const maskId = opts.idSuffix ? `tc-hole-${opts.idSuffix}` : `tc-hole-${name}`;
  const mask = buildHoleMask(def, maskId);

  const parts: ElementSpec[] = [];
  for (const part of def) {
    if (!part || part.t === "hole") continue;
    const { tag, attrs } = shapeAttrs(part);
    const color = colorFor(part, variant, accent);

    if (part.tf) {
      attrs["transform"] = part.tf;
      if (!part.scaleStroke) attrs["vector-effect"] = "non-scaling-stroke";
    }
    if (part.masked && mask) attrs["mask"] = `url(#${mask.id})`;

    if (part.fill || part.activeFill) {
      attrs["fill"] = color;
    } else {
      let dash = "100 0";
      if (part.dashArray) dash = part.dashArray;
      else if (!solid && part.gaps && part.gaps.length) {
        const used = variant === "B" || variant === "D" ? part.gaps : part.gaps.slice(0, 1);
        dash = dashFor(used);
      }
      Object.assign(attrs, {
        fill: "none",
        stroke: color,
        "stroke-width": strokeWidth,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        pathLength: 100,
        "stroke-dasharray": dash,
        "data-dash": dash,
      });
    }
    parts.push({ tag, attrs });
  }

  return {
    svgAttrs: {
      viewBox: `${inset} ${inset} ${visible} ${visible}`,
      width: size,
      height: size,
      fill: "none",
      "data-icon": name,
    },
    mask,
    parts,
    strokeWidth,
    strokeOnScreen: onScreen,
  };
}
