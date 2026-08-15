// Семантика пишется руками и легко расходится с набором: глиф переименовали,
// а описание осталось ссылаться на старое имя. Тогда агент получит совет взять
// иконку, которой нет.

import { describe, expect, it } from "vitest";
import { META, hasMeta, searchIcons } from "./meta.js";
import { iconNames } from "./renderSpec.js";

const names = iconNames();
const known = new Set<string>(names);

describe("связность с набором", () => {
  it("описания даны только существующим глифам", () => {
    for (const name of Object.keys(META)) {
      expect(known.has(name), `нет такого глифа: ${name}`).toBe(true);
    }
  });

  it("родственные ссылаются на существующие глифы", () => {
    for (const [name, meta] of Object.entries(META)) {
      for (const related of meta.related ?? []) {
        expect(known.has(related), `${name} → ${related}`).toBe(true);
      }
    }
  });

  it("глиф не приходится сам себе родственником", () => {
    for (const [name, meta] of Object.entries(META)) {
      expect(meta.related ?? [], name).not.toContain(name);
    }
  });

  it("имена в тексте avoid ссылаются на существующие глифы", () => {
    // Совет «возьми `archive`» бесполезен, если такого имени в наборе нет.
    for (const [name, meta] of Object.entries(META)) {
      for (const match of (meta.avoid ?? "").matchAll(/`([a-z0-9-]+)`/g)) {
        expect(known.has(match[1]!), `${name}: упомянут ${match[1]}`).toBe(true);
      }
    }
  });
});

describe("качество описаний", () => {
  it("у каждого есть use и синонимы", () => {
    for (const [name, meta] of Object.entries(META)) {
      // Порог низкий нарочно: у инструмента «Harp.» — исчерпывающее описание,
      // а вот пустую строку или заглушку поймать надо. Точка в конце — признак
      // того, что фразу дописали, а не бросили на полуслове.
      expect(meta.use.length, name).toBeGreaterThanOrEqual(5);
      expect(meta.use.trim().endsWith("."), `${name}: use не фраза`).toBe(true);
      expect(meta.synonyms.length, name).toBeGreaterThan(1);
    }
  });

  it("синонимы даны на двух языках", () => {
    for (const [name, meta] of Object.entries(META)) {
      const hasCyrillic = meta.synonyms.some((s) => /[а-яё]/i.test(s));
      const hasLatin = meta.synonyms.some((s) => /[a-z]/i.test(s));
      expect(hasCyrillic, `${name}: нет русских синонимов`).toBe(true);
      expect(hasLatin, `${name}: нет английских синонимов`).toBe(true);
    }
  });

  it("синонимы внутри глифа не повторяются", () => {
    for (const [name, meta] of Object.entries(META)) {
      expect(new Set(meta.synonyms).size, name).toBe(meta.synonyms.length);
    }
  });
});

describe("поиск", () => {
  it("находит по имени", () => {
    expect(searchIcons("bell", names)).toContain("bell");
  });

  it("находит по русскому синониму", () => {
    expect(searchIcons("удалить", names)).toContain("trash");
    expect(searchIcons("скрыть", names)).toContain("eye-off");
  });

  it("находит по английскому синониму, которого нет в имени", () => {
    expect(searchIcons("success", names)).toContain("check-circle");
    expect(searchIcons("spinner", names)).toContain("loading");
  });

  it("пустой запрос возвращает всё", () => {
    expect(searchIcons("  ", names).length).toBe(names.length);
  });

  it("на бессмыслицу возвращает пусто, а не падает", () => {
    expect(searchIcons("щщщ", names)).toEqual([]);
  });
});

describe("охват", () => {
  it("описано хоть что-то и видно, сколько осталось", () => {
    const described = Object.keys(META).length;
    // Не жёсткий порог, а отметка прогресса: набор описывается партиями.
    expect(described).toBeGreaterThan(0);
    console.log(`семантика: ${described} из ${names.length}, осталось ${names.length - described}`);
  });

  it("самые путаемые глифы описаны в первую очередь", () => {
    for (const name of ["trash", "archive", "check", "check-circle", "x", "circle-x", "eye-off"]) {
      expect(hasMeta(name), name).toBe(true);
    }
  });
});
