// Данные набора правятся руками, и кривая запись всплывает только на экране —
// поэтому проверяем их целостность отдельно от рендера.

import { describe, expect, it } from "vitest";
import { ANIM, ICONS, SOLID_BY_DEFAULT, type IconDef, type Part } from "./data.js";
import { dashFor } from "./stroke.js";

const entries = Object.entries(ICONS as unknown as Record<string, IconDef>);

describe("данные глифов", () => {
  it("набор не пустой и имена уникальны", () => {
    expect(entries.length).toBeGreaterThan(200);
    expect(new Set(Object.keys(ICONS)).size).toBe(entries.length);
  });

  it("имена годятся для id, файлов и url", () => {
    for (const [name] of entries) {
      expect(name, name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("у каждой части заполнены обязательные поля", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        if (!raw) continue;
        const part = raw as Part;
        if (part.t === "path" || part.t === "hole") {
          if (part.t === "hole" && part.d == null) {
            expect(part.cx, name).toBeTypeOf("number");
            continue;
          }
          expect(part.d, name).toBeTypeOf("string");
        } else if (part.t === "circle") {
          for (const key of ["cx", "cy", "r"] as const) expect(part[key], `${name}.${key}`).toBeTypeOf("number");
        } else {
          for (const key of ["x", "y", "w", "h", "rx"] as const) expect(part[key], `${name}.${key}`).toBeTypeOf("number");
        }
      }
    }
  });

  it("разрезы лежат внутри контура и не наезжают друг на друга", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        const gaps = (raw as Part | null)?.gaps;
        if (!gaps?.length) continue;
        const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
        let prevEnd = 0;
        for (const [start, width] of sorted) {
          expect(start, name).toBeGreaterThanOrEqual(0);
          expect(width, name).toBeGreaterThan(0);
          expect(start + width, name).toBeLessThanOrEqual(100);
          expect(start, `${name}: разрезы наезжают`).toBeGreaterThanOrEqual(prevEnd);
          prevEnd = start + width;
        }
      }
    }
  });

  it("dashFor всегда покрывает ровно длину контура", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        const gaps = (raw as Part | null)?.gaps;
        if (!gaps?.length) continue;
        const sum = dashFor(gaps).split(" ").reduce((acc, n) => acc + Number(n), 0);
        expect(sum, name).toBeCloseTo(100, 5);
      }
    }
  });
});

describe("сопутствующие таблицы", () => {
  it("пресеты анимации ссылаются на существующие глифы", () => {
    for (const name of Object.keys(ANIM)) {
      expect(Object.prototype.hasOwnProperty.call(ICONS, name), name).toBe(true);
    }
  });

  it("список сплошных по умолчанию ссылается на существующие глифы", () => {
    for (const name of SOLID_BY_DEFAULT) {
      expect(Object.prototype.hasOwnProperty.call(ICONS, name), name).toBe(true);
    }
  });
});
