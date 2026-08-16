// Варианты глифов, не вошедшие в набор.
//
// Пятьдесят имён были в обоих исходных наборах, и у четырнадцати геометрия
// разошлась. Владелец выбрал версию глазами по сравнению «оба варианта рядом»;
// проигравшие лежат здесь — если при переезде проекта где-то не сойдётся
// привычная форма, замена сводится к переносу одной строки.
//
// Лежит в scripts, а не в пакете: это справочник для переезда проектов,
// в рантайме он не нужен и в npm ему делать нечего.

import type { IconDef } from "../packages/core/src/data.ts";

const p = (d: string, gaps?: [number, number][] | null, o: Record<string, unknown> = {}) => ({ t: "path", d, gaps, ...o });
const c = (cx: number, cy: number, r: number, gaps?: [number, number][] | null, o: Record<string, unknown> = {}) => ({ t: "circle", cx, cy, r, gaps, ...o });
const rc = (x: number, y: number, w: number, h: number, rx: number, gaps?: [number, number][] | null, o: Record<string, unknown> = {}) => ({ t: "rect", x, y, w, h, rx, gaps, ...o });
const dot = (cx: number, cy: number, r: number, o: Record<string, unknown> = {}) => ({ t: "circle", cx, cy, r, fill: true, ...o });

export const ALT_ICONS = {
// arrow-left: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "arrow-left": [p("M19 12H5", [[30, 18]]), p("M11 6l-6 6 6 6")],
  // check: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "check": [p("M20 6 9 17l-5-5", [[42, 14]])],
  // edit: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "edit": [p("M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6", [[38, 16]]), p("M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z", [[16, 10]], { accent: true })],
  // eye-off: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "eye-off": [p("M2.5 12S6 5.5 12 5.5c1.6 0 3 .4 4.3 1.1M21.5 12S18 18.5 12 18.5c-1.6 0-3-.4-4.3-1"), p("M4 20 20 4", [[42, 16]], { accent: true })],
  // filter: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "filter": [p("M3 5h18", [[58, 16]]), p("M6 12h12", [[16, 16]]), p("M10 19h4", [[58, 22]])],
  // image: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "image": [rc(3, 3, 18, 18, 2.5, [[13, 9], [63, 9]]), c(9, 9, 2, null, { accent: true }), p("m21 15-5-5L5 21", [[40, 14]])],
  // mention: в наборе версия Ansamblist, здесь лежит прежняя из Taskless
  "mention": [c(12, 12, 4, [[20, 14]], { accent: true }), p("M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1", [[16, 10]])],
  // menu: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "menu": [p("M4 7h16M4 12h16M4 17h16")],
  // mic: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "mic": [rc(9, 2.5, 6, 11.5, 3, [[15, 11], [63, 11]]), p("M5.5 12v.5a6.5 6.5 0 0 0 13 0V12", [[42, 14]], { accent: true }), p("M12 19v2.5"), p("M8.5 21.5h7")],
  // mic-off: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "mic-off": [rc(9, 2.5, 6, 11.5, 3, [[15, 11], [63, 11]]), p("M5.5 12v.5a6.5 6.5 0 0 0 13 0V12", [[42, 14]]), p("M12 19v2.5"), p("M8.5 21.5h7"), p("M4 20 20 4", [[42, 16]], { accent: true })],
  // music: в наборе версия Ansamblist, здесь лежит прежняя из Taskless
  "music": [p("M9 18V5l12-2v13", [[45, 14]]), c(6, 18, 3, [[20, 16]]), c(18, 16, 3, [[20, 16]])],
  // screen-share: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "screen-share": [rc(2.5, 4, 19, 12.5, 2, [[13, 9], [62, 9]]), p("M12 16.5v4", [[45, 18]]), p("M8.5 20.5h7"), p("M12 13.5v-5"), p("m9.5 11 2.5-2.5 2.5 2.5", null, { accent: true })],
  // send: в наборе версия Taskless, здесь лежит вариант Ansamblist
  "send": [p("M22 2 11 13", [[36, 24]]), p("M22 2l-7 20-4-9-9-4z", [[10, 8], [60, 8]])],
  // video-off: в наборе версия Ansamblist, здесь лежит прежняя из Taskless
  "video-off": [rc(3, 6, 11, 12, 2.5, [[14, 10]]), p("M17 9.5 21 8v8l-3-1.5"), p("M20 4 4 20", [[42, 16]], { accent: true })],
} as unknown as Record<string, IconDef>;
