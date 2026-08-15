import { describe, expect, it } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { renderSpec, hasIcon, iconNames } from "./renderSpec.js";
import { strokeOnScreen } from "./stroke.js";

const attr = (spec: NonNullable<ReturnType<typeof renderSpec>>, i = 0) => spec.parts[i]!.attrs;

describe("имена глифов", () => {
  it("неизвестное имя даёт null, а не исключение", () => {
    expect(renderSpec("нет-такого")).toBeNull();
  });

  // ICONS[name] достал бы методы прототипа: они truthy, проверку на
  // существование проходят и роняют функцию на def.filter.
  it.each(["toString", "valueOf", "hasOwnProperty", "__proto__", "constructor"])(
    "имя из прототипа (%s) даёт null",
    (name) => {
      expect(() => renderSpec(name)).not.toThrow();
      expect(renderSpec(name)).toBeNull();
    },
  );

  it("hasIcon согласован с renderSpec", () => {
    for (const name of ["bell", "toString", "нет-такого", "rocket"]) {
      expect(hasIcon(name)).toBe(renderSpec(name) !== null);
    }
  });
});

describe("толщина штриха", () => {
  it("на экране выходит ровно та, что обещана, на всех размерах", () => {
    for (const size of [10, 12, 16, 24, 32, 48, 64, 128]) {
      const spec = renderSpec("bell", { size })!;
      const inset = Number(String(spec.svgAttrs["viewBox"]).split(" ")[0]);
      const visible = 24 - 2 * inset;
      expect(spec.strokeAttr * (size / visible)).toBeCloseTo(spec.strokeOnScreen, 10);
      expect(spec.strokeOnScreen).toBeCloseTo(strokeOnScreen(size), 10);
    }
  });

  it("без зума пересчёт тоже сходится", () => {
    const spec = renderSpec("bell", { size: 48, zoom: false })!;
    expect(spec.svgAttrs["viewBox"]).toBe("0 0 24 24");
    expect(spec.strokeAttr * (48 / 24)).toBeCloseTo(spec.strokeOnScreen, 10);
  });

  // size приходит из данных и из замеров контейнера — ноль и мусор там будни.
  it.each([0, -10, NaN, Infinity])("вырожденный размер (%s) не даёт NaN в атрибутах", (size) => {
    const spec = renderSpec("bell", { size })!;
    expect(Number.isFinite(spec.strokeAttr)).toBe(true);
    expect(Number.isFinite(spec.strokeOnScreen)).toBe(true);
    expect(String(attr(spec)["stroke-width"])).not.toMatch(/NaN|Infinity/);
    expect(Number(spec.svgAttrs["width"])).toBeGreaterThan(0);
  });

  it("absoluteStroke держит толщину на любом размере", () => {
    for (const size of [12, 24, 128]) {
      expect(renderSpec("bell", { size, absoluteStroke: true })!.strokeOnScreen).toBeCloseTo(1.5, 10);
    }
  });
});

describe("части с трансформом", () => {
  // При non-scaling-stroke ширина считается в координатах вьюпорта, масштаб
  // viewBox на неё не действует. Компенсация зума таким частям не нужна: с ней
  // корпус инструмента на 128px оказывался в шесть раз тоньше соседних линий.
  const NAME = "__тест-с-трансформом";

  it("получают толщину в экранных пикселях, а не в единицах viewBox", () => {
    const icons = ICONS as unknown as Record<string, IconDef>;
    icons[NAME] = [
      { t: "path", d: "M4 4h16", gaps: null, tf: "scale(1.2)" },
      { t: "path", d: "M4 8h16", gaps: null },
    ];
    try {
      for (const size of [24, 48, 128]) {
        const spec = renderSpec(NAME, { size })!;
        const scaled = spec.parts[0]!.attrs;
        const plain = spec.parts[1]!.attrs;
        expect(scaled["vector-effect"]).toBe("non-scaling-stroke");
        expect(scaled["stroke-width"]).toBeCloseTo(spec.strokeOnScreen, 10);
        expect(plain["stroke-width"]).toBeCloseTo(spec.strokeAttr, 10);
      }
    } finally {
      delete icons[NAME];
    }
  });
});

describe("варианты и разрезы", () => {
  it("A и C оставляют один разрез, B и D — все", () => {
    const dashes = (v: "A" | "B" | "C" | "D") =>
      String(renderSpec("bell", { variant: v })!.parts[0]!.attrs["stroke-dasharray"]).split(" ").length;
    expect(dashes("A")).toBeLessThan(dashes("B"));
    expect(dashes("A")).toBe(dashes("C"));
    expect(dashes("B")).toBe(dashes("D"));
  });

  it("solid убирает разрезы, не трогая данные", () => {
    const solid = renderSpec("bell", { solid: true })!;
    expect(solid.parts.every((p) => p.attrs["stroke-dasharray"] === "100 0")).toBe(true);
    expect(ICONS["bell"]![0]!.gaps).toBeTruthy();
  });

  it("акцент красится переменной только в C и D", () => {
    const accented = (v: "A" | "B" | "C" | "D") =>
      renderSpec("bell", { variant: v })!.parts.some((p) => String(p.attrs["stroke"]).includes("--tacet-accent"));
    expect(accented("A")).toBe(false);
    expect(accented("B")).toBe(false);
    expect(accented("C")).toBe(true);
    expect(accented("D")).toBe(true);
  });
});

describe("маска-вырез", () => {
  it("id склеен из имени и суффикса", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: "abc" })!;
    expect(spec.mask?.id).toBe("tc-hole-calendar-clock-abc");
  });

  it("из суффикса выкидывается всё, что может сломать атрибут", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: 'x" onload="alert(1)' })!;
    expect(spec.mask!.id).toBe("tc-hole-calendar-clock-xonloadalert1");
    expect(spec.mask!.id).not.toMatch(/["'<>() ]/);
  });

  it("React-подобный id с двоеточиями не ломает ссылку", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: ":r1:" })!;
    expect(spec.mask!.id).not.toContain(":");
    const masked = spec.parts.find((p) => p.attrs["mask"]);
    if (masked) expect(masked.attrs["mask"]).toBe(`url(#${spec.mask!.id})`);
  });
});

describe("набор целиком", () => {
  it("каждый глиф рендерится и даёт хотя бы одну фигуру", () => {
    for (const name of iconNames()) {
      const spec = renderSpec(name, { size: 24 });
      expect(spec, name).not.toBeNull();
      expect(spec!.parts.length, name).toBeGreaterThan(0);
    }
  });

  it("ни одного NaN или undefined в атрибутах", () => {
    for (const name of iconNames()) {
      for (const part of renderSpec(name, { size: 20 })!.parts) {
        for (const [key, value] of Object.entries(part.attrs)) {
          expect(String(value), `${name}.${key}`).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });
});
