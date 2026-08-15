// Семантика набора: не «как называется», а «когда брать».
//
// Теги для поиска есть у любого набора иконок. Здесь другое: подсказка выбора,
// адресованная в первую очередь агенту, который пишет интерфейс и берёт иконку
// по имени. Именно так рождаются trash вместо archive и check вместо
// check-circle — человек ловит это глазами, агент нет.
//
// `use` и `avoid` — по-английски: пакет международный. Синонимы — на обоих
// языках, чтобы поиск находил и по «сохранить», и по «save».

import { UI_META } from "./metaUi.js";
import { UI_META_2 } from "./metaUi2.js";
import { INSTRUMENT_META } from "./metaInstruments.js";
import { SERVICE_META } from "./metaServices.js";
import type { IconMeta } from "./metaTypes.js";

export type { IconMeta } from "./metaTypes.js";

export const META: Record<string, IconMeta> = {
  ...UI_META,
  ...UI_META_2,
  ...INSTRUMENT_META,
  ...SERVICE_META,
};

/** Есть ли описание для глифа. */
export function hasMeta(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(META, name);
}

/** Поиск по имени и синонимам, регистр не важен. */
export function searchIcons(query: string, names: readonly string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...names];
  return names.filter((name) => {
    if (name.includes(q)) return true;
    const meta = META[name];
    if (!meta) return false;
    return meta.synonyms.some((word) => word.toLowerCase().includes(q));
  });
}
