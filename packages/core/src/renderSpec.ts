// «Имя глифа → готовые атрибуты SVG». Чистая функция: ни DOM, ни React.
// На неё опираются обе обёртки, поэтому движок в наборе ровно один.

import { ICONS, SOLID_BY_DEFAULT, type IconDef, type IconName, type Part } from "./data.js";
import { dashFor, insetFor, normalizeSize, strokeOnScreen, type StrokeOpts } from "./stroke.js";

/** A — один разрез · B — все разрезы · C — один разрез и акцент · D — все разрезы и акцент. */
export type IconVariant = "A" | "B" | "C" | "D";

/** Цвет акцентных деталей. Без переменной иконка монохромная. */
export const ACCENT_VAR = "var(--tacet-accent, currentColor)";

/**
 * Класс группы, в которой лежит тело глифа. По нему движок находит, что
 * анимировать: без этой группы `animate()` молча ничего не сделает.
 */
export const BODY_CLASS = "tc-body";

/**
 * Стили, без которых svg отрисуется неверно. `overflow: visible` обязателен:
 * при оптическом зуме края глифов выходят за окно viewBox, а браузер по
 * умолчанию их срезает.
 */
export const SVG_STYLE = { overflow: "visible" } as const;

// ICONS закрыт через satisfies — иначе IconName выродится в string. Для доступа
// по произвольной строке нужен вид пошире.
const BY_NAME = ICONS as Record<string, IconDef>;

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
  /**
   * Хвост для id маски. Нужен, когда на странице несколько экземпляров одного
   * и того же глифа: у разных глифов id и так разные, в него входит имя.
   * Из строки берутся только буквы, цифры, дефис и подчёркивание.
   */
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
  /** Атрибуты корневого `<svg>`. Стили не входят — их отдаёт SVG_STYLE. */
  svgAttrs: Record<string, string | number>;
  /** Маска-вырез, если у глифа есть части типа `hole`. */
  mask: MaskSpec | null;
  /** Тело глифа. Кладётся в `<g class="tc-body">`, иначе анимация его не найдёт. */
  parts: ElementSpec[];
  /**
   * Значение атрибута `stroke-width`, в единицах viewBox. Это НЕ то же самое,
   * что `RenderOpts.strokeWidth` — тот задаётся в пикселях экрана. Обратно в
   * опции годится `strokeOnScreen`, а не это поле.
   */
  strokeAttr: number;
  /** Толщина штриха на экране, в CSS-пикселях. */
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

/** id попадает в атрибут и в url(#...) — пускаем только безопасные символы. */
function safeId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, "");
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
export function iconNames(): IconName[] {
  return Object.keys(ICONS) as IconName[];
}

export function renderSpec(name: string, opts: RenderOpts = {}): RenderResult | null {
  // Именно hasOwnProperty, а не `ICONS[name]`: иначе "toString" и "valueOf"
  // достанут методы прототипа, пройдут проверку на существование и уронят
  // функцию там, где по контракту должен вернуться null.
  if (!hasIcon(name)) return null;
  const def = BY_NAME[name]!;

  const size = normalizeSize(opts.size ?? 24);
  const variant = opts.variant ?? "D";
  const accent = opts.accentColor ?? ACCENT_VAR;
  const solid = isSolid(name, opts.solid);
  const zoom = opts.zoom ?? true;

  const inset = zoom ? insetFor(size) : 0;
  const visible = 24 - 2 * inset;
  const onScreen = strokeOnScreen(size, opts);
  // Атрибут задаётся в единицах viewBox, а на экране всё умножается на
  // size/visible. Отсюда обратный пересчёт — тогда экранная толщина равна
  // ровно onScreen.
  const strokeAttr = (onScreen * visible) / size;

  const suffix = opts.idSuffix ? safeId(opts.idSuffix) : "";
  const maskId = `tc-hole-${safeId(name)}${suffix ? "-" + suffix : ""}`;
  const mask = buildHoleMask(def, maskId);

  const parts: ElementSpec[] = [];
  for (const part of def) {
    if (!part || part.t === "hole") continue;
    const { tag, attrs } = shapeAttrs(part);
    const color = colorFor(part, variant, accent);

    // При non-scaling-stroke ширина считается в координатах вьюпорта, то есть
    // масштаб viewBox на неё не действует и компенсировать нечего. Отдадим сюда
    // strokeAttr — и деталь окажется тоньше соседей тем сильнее, чем крупнее
    // иконка: на 128px корпус скрипки был бы в шесть раз тоньше её грифа.
    let nonScaling = false;
    if (part.tf) {
      attrs["transform"] = part.tf;
      if (!part.scaleStroke) {
        attrs["vector-effect"] = "non-scaling-stroke";
        nonScaling = true;
      }
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
        "stroke-width": nonScaling ? onScreen : strokeAttr,
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
    strokeAttr,
    strokeOnScreen: onScreen,
  };
}
