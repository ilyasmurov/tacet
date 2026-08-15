// Толщина штриха, оптический зум и разрезы — вся геометрия, не зависящая от глифа.

import type { Gap } from "./data.js";

/** Толщина штриха на экране при размере 24px. Точка, по которой калибровался набор. */
export const STROKE_AT_24 = 1.5;

/**
 * Насколько толщина следует за размером. 0 — не меняется вовсе, 1 — растёт
 * пропорционально иконке.
 *
 * 0.45 подобран по глифам набора: на 12–24px даёт ту же толщину, с которой
 * иконки рисовались, а на крупных не позволяет линии разжиреть — 128px выходит
 * 3.16px против 7.2px при пропорциональном росте.
 */
export const STROKE_EXPONENT = 0.45;

export interface StrokeOpts {
  /**
   * Толщина на экране в CSS-пикселях. Задана — размер на неё не влияет.
   * Внимание: это экранная величина, а не значение атрибута `stroke-width`;
   * атрибут считается от неё с поправкой на масштаб viewBox.
   */
  strokeWidth?: number | undefined;
  /** Толщина не растёт с размером: ровно STROKE_AT_24 на любом размере. */
  absoluteStroke?: boolean | undefined;
}

/** Толщина штриха на экране, в CSS-пикселях. */
export function strokeOnScreen(size: number, opts: StrokeOpts = {}): number {
  if (opts.strokeWidth != null) return opts.strokeWidth;
  if (opts.absoluteStroke) return STROKE_AT_24;
  return STROKE_AT_24 * Math.pow(size / 24, STROKE_EXPONENT);
}

/**
 * Оптический зум. Глифы набора занимают около 74% бокса 24×24 — заметно меньше,
 * чем у большинства наборов, — поэтому при одинаковом `size` читались бы мельче.
 * Обрезаем viewBox с каждой стороны, но мелкие иконки зумим слабее: на 12px
 * полный зум раздувает глиф и утолщает штрих относительно него.
 *
 * 12px → +8% · 16px → +14% · 20px и выше → +18%
 *
 * Крайние глифы доходят до 23 единиц и вылезают за бокс примерно на единицу,
 * поэтому у svg должен стоять `overflow: visible`, а не клип.
 */
export function insetFor(size: number): number {
  if (size <= 12) return 0.9;
  if (size <= 16) return 0.9 + ((size - 12) / 4) * 0.5;
  if (size <= 20) return 1.4 + ((size - 16) / 4) * 0.4;
  return 1.8;
}

/**
 * Разрезы в `stroke-dasharray`. На вход — пары [начало%, ширина%] по длине
 * контура, приведённой к 100 через `pathLength`. Отсюда и берётся главное
 * свойство набора: разрез задан данными, а не вырезан в геометрии, поэтому
 * его можно двигать и убирать, не трогая путь.
 */
export function dashFor(gaps: Gap[]): string {
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  let pos = 0;
  for (const [start, width] of sorted) {
    out.push(Math.max(start - pos, 0.01), width);
    pos = start + width;
  }
  out.push(Math.max(100 - pos, 0.01));
  return out.join(" ");
}
