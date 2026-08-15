import { describe, expect, it } from "vitest";
import { dashFor, insetFor, normalizeSize, STROKE_AT_24, strokeOnScreen } from "./stroke.js";

describe("кривая толщины", () => {
  it("в точке калибровки совпадает с заданной", () => {
    expect(strokeOnScreen(24)).toBeCloseTo(STROKE_AT_24, 10);
  });

  it("растёт с размером, но медленнее него", () => {
    const at24 = strokeOnScreen(24);
    const at128 = strokeOnScreen(128);
    expect(at128).toBeGreaterThan(at24);
    // Иконка выросла в 5.3 раза — штрих не должен вырасти даже вдвое с половиной.
    expect(at128 / at24).toBeLessThan(2.5);
  });

  it("на мелких повторяет старую таблицу набора", () => {
    // Значения, с которыми глифы рисовались: 12px → 1.10, 24px → 1.50.
    expect(strokeOnScreen(12)).toBeCloseTo(1.1, 1);
    expect(strokeOnScreen(24)).toBeCloseTo(1.5, 2);
  });

  it("монотонна", () => {
    let prev = 0;
    for (const size of [8, 10, 12, 14, 16, 20, 24, 32, 40, 64, 96, 128]) {
      const value = strokeOnScreen(size);
      expect(value).toBeGreaterThan(prev);
      prev = value;
    }
  });

  it.each([0, -1, NaN, Infinity, -Infinity])("вырожденный размер (%s) не даёт NaN", (size) => {
    expect(Number.isFinite(strokeOnScreen(size))).toBe(true);
    expect(normalizeSize(size)).toBe(24);
  });

  it("явная толщина побеждает размер", () => {
    expect(strokeOnScreen(128, { strokeWidth: 2 })).toBe(2);
    expect(strokeOnScreen(12, { strokeWidth: 2 })).toBe(2);
  });

  it("мусор в strokeWidth не проходит в расчёт", () => {
    expect(Number.isFinite(strokeOnScreen(24, { strokeWidth: NaN }))).toBe(true);
  });
});

describe("оптический зум", () => {
  it("мелкие зумим слабее крупных", () => {
    expect(insetFor(12)).toBeLessThan(insetFor(24));
    expect(insetFor(16)).toBeLessThan(insetFor(20));
  });

  it("за 20px выходит на полку", () => {
    expect(insetFor(20)).toBeCloseTo(insetFor(24), 10);
    expect(insetFor(128)).toBeCloseTo(insetFor(24), 10);
  });

  it("не съедает больше пятой части бокса", () => {
    for (const size of [8, 12, 16, 24, 64, 128]) {
      expect(24 - 2 * insetFor(size)).toBeGreaterThan(19);
    }
  });
});

describe("разрезы", () => {
  it("пара разрезов раскладывается в чередование штрих-пробел", () => {
    expect(dashFor([[12, 9], [58, 9]])).toBe("12 9 37 9 33");
  });

  const sumOf = (gaps: Array<[number, number]>) =>
    dashFor(gaps).split(" ").reduce((acc, n) => acc + Number(n), 0);

  it("сумма равна длине контура, когда разрезы не касаются краёв", () => {
    expect(sumOf([[10, 5], [50, 5], [80, 5]])).toBeCloseTo(100, 6);
    expect(sumOf([[12, 9], [58, 9]])).toBeCloseTo(100, 6);
  });

  it("разрез, упёршийся в край, добавляет сотую долю процента", () => {
    // Нулевой сегмент заменяется на 0.01 — так в наборе с самого начала.
    // На глаз незаметно, но точного равенства сотне ждать нельзя.
    for (const gaps of [[[0, 10]], [[90, 10]]] as Array<Array<[number, number]>>) {
      expect(sumOf(gaps)).toBeGreaterThan(100);
      expect(sumOf(gaps)).toBeCloseTo(100, 1);
    }
  });

  it("в настоящих данных набора краевых разрезов нет — суммы ровные", () => {
    expect(sumOf([[13, 9], [58, 9]])).toBeCloseTo(100, 6);
  });

  it("порядок разрезов не важен", () => {
    expect(dashFor([[58, 9], [12, 9]])).toBe(dashFor([[12, 9], [58, 9]]));
  });

  it("разрез в самом начале не даёт нулевой длины сегмент", () => {
    expect(dashFor([[0, 10]]).startsWith("0 ")).toBe(false);
  });
});
