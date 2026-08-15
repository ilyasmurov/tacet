// Анимация поверх уже отрисованного svg. Работает с обычным DOM-элементом,
// поэтому одинаково годится и для React-обёртки, и для веб-компонента.

import { ANIM, type AnimMode } from "./data.js";
import { BODY_CLASS } from "./renderSpec.js";

const SVGNS = "http://www.w3.org/2000/svg";
const BODY_SELECTOR = `g.${BODY_CLASS}`;

const FILL_SELECTOR =
  "circle[fill]:not([fill='none']):not([data-mk]):not([data-rev])," +
  "rect[fill]:not([fill='none']):not([data-mk]):not([data-rev])," +
  "path[fill]:not([fill='none']):not([data-mk]):not([data-rev])";
const SCALE_SELECTOR = FILL_SELECTOR + `, g.${BODY_CLASS} [data-pop]`;

// Счётчик модульный, поэтому две копии пакета на странице дали бы одинаковые
// id, а url(#id) резолвится по всему документу и берёт первый попавшийся узел —
// вторая иконка маскировалась бы силуэтом первой. Префикс на экземпляр модуля
// разводит их наверняка.
const MODULE_ID = Math.random().toString(36).slice(2, 7);
let maskCounter = 0;

export interface AnimateCfg {
  mode?: AnimMode | undefined;
  /** Длительность отрисовки, мс. */
  duration?: number | undefined;
  /** Угол доворота для режима spin, градусы. */
  spinDeg?: number | undefined;
  /** Разброс старта штрихов, мс: контур собирается вразнобой. */
  stagger?: number | undefined;
  /** Строгая очередь штрихов, мс на штрих. */
  seq?: number | undefined;
  /** Задержка до старта, мс. */
  delay?: number | undefined;
}

/** То, что возвращает resolveAnimateCfg и ждут prepare/animate. */
export interface ResolvedAnimateCfg {
  mode: AnimMode; duration: number; spinDeg: number; stagger: number; seq: number; delay: number;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Играть ли анимацию появления на этом устройстве.
 *
 * На телефоне иконки появляются во время скролла — анимации толком не видно,
 * а стоит она дорого: на стенде из 360 иконок отрисовка занимала 1718 мс против
 * 857 мс без неё и оставляла в DOM лишнюю тысячу узлов. Причина в том, что режим
 * draw строит на каждую иконку маску из клонов всех её фигур и форсирует reflow.
 *
 * Предикат передаётся снаружи (в браузере — `window.matchMedia`), чтобы правило
 * можно было проверить тестом, а не гадать про окружение.
 */
export function canAnimateOnMount(matches: ((query: string) => boolean) | null): boolean {
  if (!matches) return false;
  return matches("(hover: hover) and (pointer: fine)");
}

/** Пресет анимации для глифа, дополненный тем, что передали вызовом. */
export function resolveAnimateCfg(name: string, cfg: AnimateCfg = {}): ResolvedAnimateCfg {
  const preset = ANIM[name] ?? {};
  return {
    mode: cfg.mode ?? preset.mode ?? "draw",
    duration: cfg.duration ?? preset.dur ?? 620,
    spinDeg: cfg.spinDeg ?? preset.deg ?? 90,
    stagger: cfg.stagger ?? preset.stagger ?? 0,
    seq: cfg.seq ?? preset.seq ?? 0,
    delay: cfg.delay ?? 0,
  };
}

/** Чем описывается текущее содержимое тела: по нему видно, что глиф сменился. */
function bodySignature(svg: SVGSVGElement, body: SVGGElement): string {
  return (svg.getAttribute("data-icon") ?? "") + ":" + body.children.length;
}

function dropReveal(svg: SVGSVGElement, body: SVGGElement): void {
  const id = body.dataset["revealId"];
  if (!id) return;
  svg.querySelector(`mask#${id}`)?.remove();
  delete body.dataset["revealId"];
  delete body.dataset["revealFor"];
  body.removeAttribute("mask");
}

/**
 * Маска проявления: клоны всех фигур глифа, обведённые чуть толще оригинала.
 * Анимируется `stroke-dashoffset` маски, а не самого контура — иначе анимация
 * дралась бы с разрезами за один и тот же атрибут, и разрывы ползли бы по
 * контуру вместо того, чтобы стоять на месте.
 *
 * Маска кешируется на теле, но пересобирается, как только содержимое сменилось:
 * React переиспользует тот же svg-узел при смене имени иконки, и старая маска
 * оставила бы новый глиф проявляться через чужой силуэт.
 */
function buildReveal(svg: SVGSVGElement, body: SVGGElement): NodeListOf<SVGElement> {
  const signature = bodySignature(svg, body);
  const cachedId = body.dataset["revealId"];
  if (cachedId && body.dataset["revealFor"] === signature) {
    return svg.querySelectorAll<SVGElement>(`#${cachedId} [data-rev]`);
  }
  dropReveal(svg, body);

  const id = `tc-rev-${MODULE_ID}-${(maskCounter++).toString(36)}`;
  const mask = document.createElementNS(SVGNS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  mask.setAttribute("x", "-3"); mask.setAttribute("y", "-3");
  mask.setAttribute("width", "30"); mask.setAttribute("height", "30");

  body.querySelectorAll("path, circle, rect").forEach((el) => {
    const clone = el.cloneNode(false) as SVGElement;
    clone.removeAttribute("mask");
    // Клон живёт по своим правилам проявления — чужая память о разрезах ему
    // только мешает и путает выборки.
    clone.removeAttribute("data-dash");
    clone.style.cssText = "";

    const strokeAttr = el.getAttribute("stroke");
    const isStroke = !!strokeAttr && strokeAttr !== "none";
    // Мелкие кольца обводить бессмысленно — они проявляются целиком, как заливки.
    const smallRing = isStroke && el.tagName === "circle" && parseFloat(el.getAttribute("r") ?? "0") <= 3;

    if (isStroke && !smallRing) {
      const width = parseFloat(el.getAttribute("stroke-width") ?? "2");
      clone.setAttribute("stroke", "#fff");
      clone.setAttribute("fill", "none");
      clone.setAttribute("stroke-width", String(width + 0.75));
      clone.setAttribute("stroke-linecap", "round");
      clone.setAttribute("stroke-linejoin", "round");
      clone.setAttribute("pathLength", "100");
      clone.setAttribute("stroke-dasharray", "100 100");
      clone.setAttribute("stroke-dashoffset", "100");
      clone.setAttribute("data-rev", "1");
    } else if (smallRing) {
      const width = parseFloat(el.getAttribute("stroke-width") ?? "2");
      clone.setAttribute("stroke", "#fff");
      clone.setAttribute("fill", "none");
      clone.setAttribute("stroke-width", String(width + 0.75));
      clone.removeAttribute("stroke-dasharray");
      clone.setAttribute("data-fillrev", "1");
      el.setAttribute("data-pop", "1");
    } else {
      clone.setAttribute("fill", "#fff");
      clone.setAttribute("stroke", "none");
      clone.removeAttribute("stroke-dasharray");
      clone.setAttribute("data-fillrev", "1");
    }
    mask.appendChild(clone);
  });

  svg.appendChild(mask);
  body.dataset["revealId"] = id;
  body.dataset["revealFor"] = signature;
  return svg.querySelectorAll<SVGElement>(`#${id} [data-rev]`);
}

/**
 * Вернуть живым фигурам исходный вид. Нужно после reverse(): тот гасит и
 * схлопывает сам контур, а появление рисуется маской и живых фигур не трогает —
 * без сброса иконка после «стёрлась и рисуется снова» осталась бы невидимой.
 */
function restoreLive(svg: SVGSVGElement): void {
  // Только фигуры тела: клоны внутри маски тоже носят data-dash, и вернуть им
  // «исходный» dasharray значило бы сломать проявление — у них он свой,
  // рабочий («100 100» плюс сдвиг).
  svg.querySelectorAll<SVGElement>(`g.${BODY_CLASS} [data-dash]`).forEach((el) => {
    el.style.transition = "none";
    el.style.opacity = "";
    const dash = el.dataset["dash"];
    if (dash) el.style.strokeDasharray = dash;
  });
  svg.querySelectorAll<SVGElement>(FILL_SELECTOR).forEach((el) => {
    el.style.transition = "none";
    el.style.opacity = "";
    el.style.transform = "";
  });
}

/**
 * Снять всё, что навесили prepare/animate/reverse, и показать иконку как есть.
 * Зови, если анимацию подготовили, но так и не проиграли: иначе глиф останется
 * спрятанным под маской и без единой ошибки в консоли.
 */
export function resetAnimation(svg: SVGSVGElement): void {
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  svg.style.transform = "";
  svg.style.opacity = "";
  svg.style.transition = "";
  restoreLive(svg);
  if (!body) return;
  const timers = body as unknown as { __tcRevealTimer?: number };
  if (timers.__tcRevealTimer) {
    clearTimeout(timers.__tcRevealTimer);
    delete timers.__tcRevealTimer;
  }
  dropReveal(svg, body);
  body.style.transition = "";
  body.style.opacity = "";
  body.style.transform = "";
}

/**
 * Спрятать глиф до старта анимации, чтобы первый кадр не мигнул готовой
 * картинкой. Зовётся синхронно после вставки в DOM, до отрисовки.
 */
export function prepare(svg: SVGSVGElement, cfg: ResolvedAnimateCfg): void {
  if (prefersReducedMotion()) return;
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  if (!body) return;

  svg.style.transform = "";
  svg.style.opacity = "";
  restoreLive(svg);

  if (cfg.mode === "pop") {
    body.style.transformBox = "fill-box";
    body.style.transformOrigin = "center";
    body.style.transition = "none";
    body.style.transform = "scale(0.2)";
    body.style.opacity = "0";
    return;
  }
  if (cfg.mode === "fade") {
    body.style.transition = "none";
    body.style.opacity = "0";
    return;
  }

  const revs = buildReveal(svg, body);
  body.setAttribute("mask", `url(#${body.dataset["revealId"]})`);
  revs.forEach((el) => { el.style.transition = "none"; el.style.strokeDashoffset = "100"; });
  svg.querySelectorAll<SVGElement>(SCALE_SELECTOR).forEach((el) => {
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "none";
    el.style.transform = "scale(0)";
  });
  if (cfg.mode === "spin") {
    svg.style.transformOrigin = "center";
    svg.style.transition = "none";
    svg.style.transform = `rotate(-${cfg.spinDeg}deg)`;
  }
}

/** Проиграть появление. Безопасно звать повторно — это же и есть реплей. */
export function animate(svg: SVGSVGElement, cfg: ResolvedAnimateCfg): void {
  if (prefersReducedMotion()) return;
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  if (!body) return;
  const { delay, duration, stagger, seq } = cfg;

  // После reverse() живые фигуры погашены и схлопнуты — вернём их, иначе
  // рисоваться будет маска поверх невидимого глифа.
  restoreLive(svg);

  if (cfg.mode === "pop") {
    body.style.transformBox = "fill-box";
    body.style.transformOrigin = "center";
    body.style.transition = "none";
    body.style.transform = "scale(0.2)";
    body.style.opacity = "0";
    void body.getBoundingClientRect();
    body.style.transition = `transform .55s cubic-bezier(.34,1.56,.64,1) ${delay}ms, opacity .25s ease ${delay}ms`;
    body.style.transform = "scale(1)";
    body.style.opacity = "1";
    return;
  }
  if (cfg.mode === "fade") {
    body.style.transition = "none";
    body.style.opacity = "0";
    void body.getBoundingClientRect();
    body.style.transition = `opacity .5s ease ${delay}ms`;
    body.style.opacity = "1";
    return;
  }

  const revs = buildReveal(svg, body);
  body.setAttribute("mask", `url(#${body.dataset["revealId"]})`);
  revs.forEach((el) => { el.style.transition = "none"; el.style.strokeDashoffset = "100"; });
  void body.getBoundingClientRect();

  const order = Array.from({ length: revs.length }, (_, i) => i);
  if (stagger) {
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      const tmp = order[k]!; order[k] = order[j]!; order[j] = tmp;
    }
  }

  let maxExtra = 0;
  revs.forEach((el, i) => {
    const extra = seq
      ? i * seq
      : stagger ? (order[i] ?? 0) * stagger * (0.6 + Math.random() * 0.6) : 0;
    if (extra > maxExtra) maxExtra = extra;
    el.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(.45,0,.2,1) ${delay + extra}ms`;
    el.style.strokeDashoffset = "0";
  });

  if (cfg.mode === "spin") {
    svg.style.transformOrigin = "center";
    svg.style.transition = "none";
    svg.style.transform = `rotate(-${cfg.spinDeg}deg)`;
    void svg.getBoundingClientRect();
    svg.style.transition = `transform ${duration}ms cubic-bezier(.3,0,.2,1) ${delay}ms`;
    svg.style.transform = "rotate(0deg)";
  }

  // Маску снимаем, когда она отработала: пока она висит, глиф клипается по ней.
  const timers = body as unknown as { __tcRevealTimer?: number };
  if (timers.__tcRevealTimer) clearTimeout(timers.__tcRevealTimer);
  timers.__tcRevealTimer = window.setTimeout(
    () => body.removeAttribute("mask"),
    delay + duration + maxExtra + 80,
  );

  svg.querySelectorAll<SVGElement>(SCALE_SELECTOR).forEach((el, i) => {
    const isPop = el.hasAttribute("data-pop");
    const at = delay + (isPop ? 320 : 240) + i * 50;
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "none";
    el.style.transform = "scale(0)";
    void el.getBoundingClientRect();
    el.style.transition = `transform .5s cubic-bezier(.34,1.56,.64,1) ${at}ms`;
    el.style.transform = "scale(1)";
  });
}

/**
 * Обратный ход: контур стирается, заливки схлопываются. Для лоадеров и для
 * иконок, которые уезжают с экрана. Следующий animate() вернёт всё на место.
 */
export function reverse(svg: SVGSVGElement): void {
  if (prefersReducedMotion()) return;

  svg.querySelectorAll<SVGElement>(`g.${BODY_CLASS} [data-dash]`).forEach((el) => {
    const dash = el.dataset["dash"];
    if (!dash) return;
    const parts = dash.split(" ");
    const gapCount = parts.filter((_, i) => i % 2 === 1).length || 1;
    const collapsed = parts.map((_, i) => (i % 2 === 1 ? 100 / gapCount : 0)).join(" ");
    el.style.transition = "stroke-dasharray .5s cubic-bezier(.45,0,.55,1), opacity .16s ease .34s";
    el.style.strokeDasharray = collapsed;
    el.style.opacity = "0";
  });

  svg.querySelectorAll<SVGElement>(FILL_SELECTOR).forEach((el) => {
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "transform .3s cubic-bezier(.4,0,1,.6)";
    el.style.transform = "scale(0)";
  });
}
