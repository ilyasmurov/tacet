// Геометрия набора Tacet — «аутлайн с разрезами».
//
// Экспортирует ICONS, ANIM, SOLID_BY_DEFAULT и типы. Толщина штриха и разрезы
// считаются в stroke.ts, рендер — в renderSpec.ts; здесь только данные.
//
// Правила глифа: viewBox 24×24, круглые концы и стыки, глиф держится внутри
// бокса. Разрез живёт в `gaps` как [начало%, ширина%] по длине контура,
// приведённой к 100 через pathLength — то есть его можно двигать и убирать,
// не трогая сам путь. Акцентная деталь помечается `accent: true` и красится
// переменной --tacet-accent в вариантах C и D. Жёсткий цвет — только через
// `col` (приоритеты). Имена глифов заморожены: по ним стоят импорты.

export type Gap = [number, number];

export interface Part {
  t: "path" | "circle" | "rect" | "hole";
  d?: string;
  cx?: number; cy?: number; r?: number;
  x?: number; y?: number; w?: number; h?: number; rx?: number;
  gaps?: Gap[] | null | undefined;
  accent?: boolean;
  fill?: boolean;
  activeFill?: boolean;
  masked?: boolean;
  col?: string;
  dashArray?: string;
  tf?: string;
  scaleStroke?: boolean;
  sw?: number;
}

export type IconDef = (Part | null)[];
export type AnimMode = "draw" | "spin" | "pop" | "fade";
export interface AnimCfg { mode?: AnimMode; dur?: number; deg?: number; stagger?: number; seq?: number; }

// ── part builders ──
const p = (d: string, gaps?: Gap[] | null, o: Partial<Part> = {}): Part => ({ t: "path", d, gaps, ...o });
const c = (cx: number, cy: number, r: number, gaps?: Gap[] | null, o: Partial<Part> = {}): Part => ({ t: "circle", cx, cy, r, gaps, ...o });
const rc = (x: number, y: number, w: number, h: number, rx: number, gaps?: Gap[] | null, o: Partial<Part> = {}): Part => ({ t: "rect", x, y, w, h, rx, gaps, ...o });
const dot = (cx: number, cy: number, r: number, o: Partial<Part> = {}): Part => ({ t: "circle", cx, cy, r, fill: true, ...o });

// shared "file" primitives (attachment family)
const FB = "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z";
const FF = "M14 2v5a1 1 0 0 0 1 1h5";

export const ICONS: Record<string, IconDef> = {
    // ── shell / navigation ──
    "home": [p("M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z", [[8, 9], [58, 9]])],
    "inbox": [p("M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z", [[13, 9], [60, 9]]), p("M22 12h-6l-2 3h-4l-2-3H2", [[42, 14]], { accent: true })],
    "search": [c(11, 11, 7, [[12, 12], [62, 10]]), p("m20 20-3.5-3.5")],
    "bell": [p("M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z", [[14, 10], [60, 10]]), p("M10 19a2 2 0 0 0 4 0", null, { accent: true })],
    "settings": [p("M4 6.5h10M18.5 6.5H20M4 12h3M11.5 12H20M4 17.5h10M18.5 17.5H20"), c(16, 6.5, 2, [[20, 22]], { accent: true }), c(9, 12, 2, [[20, 22]]), c(16, 17.5, 2, [[20, 22]])],
    "calendar": [rc(3, 5, 18, 16, 2, [[12, 9], [62, 9]]), p("M3 10h18", [[40, 20]]), p("M8 3v4M16 3v4", null, { accent: true })],
    "calendar-clock": [rc(3, 5, 18, 16, 2, [[12, 9], [58, 9]], { masked: true }), p("M3 10h18", [[42, 18]], { masked: true }), p("M8 3v4M16 3v4", null, { accent: true }), { t: "hole", cx: 17.5, cy: 17.5, r: 5.3 }, c(17.5, 17.5, 4, [[22, 16]], { accent: true }), p("M17.5 15.4v2.1l1.5 1", null, { accent: true })],
    "users": [p("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", [[40, 18]]), c(9, 7, 4, [[15, 14]]), p("M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", null, { accent: true })],
    "user": [c(12, 7.75, 4.25, [[18, 13]], { accent: true }), p("M4.5 20.5v-.75a6.25 6.25 0 0 1 6.25-6.25h2.5a6.25 6.25 0 0 1 6.25 6.25v.75", [[42, 16]])],
    "building": [rc(4, 3, 16, 18, 1.5, [[13, 9], [62, 9]]), p("M9.5 21v-4h5v4"), dot(8, 7, 0.85, { accent: true }), dot(12, 7, 0.85), dot(16, 7, 0.85, { accent: true }), dot(8, 11, 0.85), dot(12, 11, 0.85, { accent: true }), dot(16, 11, 0.85)],
    "layout-grid": [rc(3.5, 3.5, 7.4, 7.4, 2, [[15, 12]]), rc(13.1, 3.5, 7.4, 7.4, 2, null, { accent: true }), rc(3.5, 13.1, 7.4, 7.4, 2, [[60, 12]]), rc(13.1, 13.1, 7.4, 7.4, 2, [[15, 12]])],
    "folder-kanban": [p("M3 6.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", [[12, 9], [58, 9]]), p("M9 12v4", null, { accent: true }), p("M12 10.5v5.5"), p("M15 12v3", null, { accent: true })],
    "layers": [p("M12 2.5 21 7l-9 4.5L3 7z", [[14, 9], [58, 9]]), p("M3 12l9 4.5 9-4.5", [[40, 14]], { accent: true }), p("M3 17l9 4.5 9-4.5", [[40, 14]])],
    "columns": [rc(3, 4.5, 4.6, 15, 1.2, [[16, 11]]), rc(9.7, 4.5, 4.6, 15, 1.2, null, { accent: true }), rc(16.4, 4.5, 4.6, 15, 1.2, [[62, 11]])],
    "menu": [p("M4 7h16", [[58, 16]]), p("M4 12h16", [[16, 16]], { accent: true }), p("M4 17h16", [[58, 16]])],
    "filter": [p("M3 5h18l-7 8v7l-4-2v-5z", [[14, 9], [58, 9]])],
    "globe": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M3 12h18", [[42, 16]], { accent: true }), p("M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18", [[42, 14]])],

    // ── tasks ──
    "list-checks": [p("M11 6.5h9", [[55, 16]]), p("M11 12h9", [[16, 16]]), p("M11 17.5h9", [[55, 16]]), p("M3.5 6.5 5 8l2.5-2.5", null, { accent: true }), p("M3.5 17.5 5 19l2.5-2.5", null, { accent: true })],
    "circle": [c(12, 12, 8.5, [[13, 9], [62, 9]])],
    "check-circle": [c(12, 12, 8.5, [[13, 9], [62, 9]]), p("M8.3 12.2l2.4 2.4 4.9-5.4", null, { accent: true })],
    "flag": [p("M5 15s1-1 4-1 5 2 8 2 3-1 3-1V4s-1 1-3 1-5-2-8-2-4 1-4 1z", [[14, 9], [60, 9]]), p("M5 21.5V15", null, { accent: true })],
    "tag": [p("M11.7 3.2A1.8 1.8 0 0 0 10.4 2.7H4.5A1.8 1.8 0 0 0 2.7 4.5v5.9a1.8 1.8 0 0 0 .53 1.27l7.8 7.8a2.2 2.2 0 0 0 3.1 0l5.9-5.9a2.2 2.2 0 0 0 0-3.1z", [[12, 9], [58, 9]]), dot(7.5, 7.5, 1.2, { accent: true })],
    "sticky-note": [p("M4 4.5h16v10l-5.5 5.5H4z", [[12, 9], [58, 9]]), p("M20 14.5h-5.5v5.5", null, { accent: true })],
    "list-tree": [p("M8 6.5h12", [[58, 14]]), p("M12 12h8", [[55, 14]], { accent: true }), p("M12 17.5h8", [[55, 14]]), p("M4.5 4.5v11.5a2 2 0 0 0 2 2H9", [[45, 14]])],
    "box": [p("M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", [[12, 9], [58, 9]]), p("M3.3 7 12 12l8.7-5", [[40, 14]], { accent: true }), p("M12 22V12")],
    "hourglass": [p("M6 3.5H18C18 7.5 15 8.5 12 12C15 15.5 18 16.5 18 20.5H6C6 16.5 9 15.5 12 12C9 8.5 6 7.5 6 3.5Z", [[52, 8], [4, 8]]), dot(12, 12, 1.1, { accent: true })],
    "rocket": [p("M12 2.5c2.8 1.7 4.5 4.9 4.5 8.5v3l-2 2h-5l-2-2v-3c0-3.6 1.7-6.8 4.5-8.5z", [[13, 9], [58, 9]]), c(12, 9.5, 1.7, [[22, 18]], { accent: true }), p("M8 16l-2.5 1.5.5 3 3-1"), p("M16 16l2.5 1.5-.5 3-3-1"), p("M10.5 18.5 12 22l1.5-3.5", null, { accent: true })],
    "star": [p("m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.8l-5.8 3 1.1-6.4L2.6 9.8l6.5-.9z", [[8, 8], [55, 8]])],
    "pin": [p("M9.3 3h5.4l-.6 6 3.4 3.5V14H6.5v-1.5L9.9 9z", [[14, 10], [62, 10]]), p("M12 14v7.5", null, { accent: true })],
    "clock": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M12 7v5l3.5 2", null, { accent: true })],
    "history": [p("M4 12a8 8 0 1 1 2.4 5.7", [[16, 10]]), p("M4 8v4h4", null, { accent: true }), p("M12 8v4.5l3 1.8", null, { accent: true })],
    "smile": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M8.5 14a4.5 4.5 0 0 0 7 0", [[42, 14]], { accent: true }), dot(9, 10, 1.15), dot(15, 10, 1.15)],

    // ── task statuses (tracker) ──
    "status-backlog": [p("M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", [[12, 9], [58, 9]]), p("M3.3 7 12 12l8.7-5", [[40, 14]], { accent: true }), p("M12 22V12")],
    "status-todo": [p("M5 12h14", [[30, 18]]), p("M13 6l6 6-6 6", null, { accent: true })],
    "status-progress": [p("M14 4.5l5.5 5.5-2 2-1.5-1.5-6.5 6.5a1.8 1.8 0 0 1-2.5-2.5l6.5-6.5-1.5-1.5z", [[13, 9], [60, 9]]), p("M14 4.5 12 6.5l3.5 3.5 2-2z", null, { accent: true })],
    "status-done": [p("M4 12l5 5 11-11", [[42, 14]], { accent: true })],
    "status-canceled": [p("m18 6-12 12", [[40, 20]], { accent: true }), p("m6 6 12 12", [[40, 20]], { accent: true })],

    // ── priorities (tracker) ──
    "priority-low": [p("m6 10 6 6 6-6", [[42, 16]], { col: "oklch(0.62 0.01 256)" })],
    "priority-medium": [p("m6 14 6-6 6 6", [[42, 16]], { col: "oklch(0.62 0.19 258)" })],
    "priority-high": [p("m6.5 11 5.5-4.5 5.5 4.5", null, { col: "oklch(0.8 0.15 84)" }), p("m6.5 15.5 5.5-4.5 5.5 4.5", null, { col: "oklch(0.8 0.15 84)" })],
    "priority-urgent": [rc(3.5, 3.5, 17, 17, 4.5, [[13, 9], [62, 9]], { col: "oklch(0.62 0.2 25)" }), p("M12 7.5v5", null, { col: "oklch(0.62 0.2 25)" }), dot(12, 16, 1.2, { col: "oklch(0.62 0.2 25)" })],

    // ── status-picker glyphs ──
    "circle-dot": [c(12, 12, 8, [[13, 9], [62, 9]]), dot(12, 12, 2.3, { accent: true })],
    "loading": [p("M12 3.5v3.5", null, { accent: true }), p("M12 17v3.5", null, { accent: true }), p("M3.5 12h3.5"), p("M17 12h3.5"), p("M6.4 6.4 8.9 8.9"), p("M15.1 15.1 17.6 17.6"), p("M17.6 6.4 15.1 8.9", null, { accent: true }), p("M8.9 15.1 6.4 17.6", null, { accent: true })],
    "circle-plus": [c(12, 12, 8, [[13, 9], [62, 9]]), p("M12 8.5v7", null, { accent: true }), p("M8.5 12h7", null, { accent: true })],
    "timer": [c(12, 13.5, 7, [[13, 9], [62, 9]]), p("M9.5 2.5h5", null, { accent: true }), p("M12 2.5v2"), p("M12 13.5V10", null, { accent: true })],
    "archive": [rc(3, 4, 18, 4.2, 1.5, [[14, 10], [64, 10]]), p("M4.7 8.2v9.8a2 2 0 0 0 2 2h10.6a2 2 0 0 0 2-2V8.2", [[42, 14]]), p("M9.75 12h4.5", null, { accent: true })],
    "flask": [p("M9.3 3.5h5.4", null, { accent: true }), p("M10.3 3.5v6L5.6 17.8a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3L13.7 9.5v-6", [[14, 9], [58, 9]]), p("M8 15h8", null, { accent: true })],
    "ban": [c(12, 12, 8.5, [[13, 9], [62, 9]]), p("M6 6 18 18", null, { accent: true })],
    "bug": [p("M8.5 9a3.5 3.5 0 0 1 7 0", [[42, 14]]), rc(7.3, 9, 9.4, 9.5, 4.7, [[13, 9], [62, 9]]), p("M12 12.5v6", null, { accent: true }), p("M7.3 11.5 4.3 10M7.3 15H4M7.3 18.5l-2.8 1.6"), p("M16.7 11.5 19.7 10M16.7 15H20M16.7 18.5l2.8 1.6"), p("M10 6.7 9 5M14 6.7 15 5", null, { accent: true })],
    "code": [p("M8.5 8 4 12l4.5 4", [[42, 14]], { accent: true }), p("M15.5 8 20 12l-4.5 4", [[42, 14]], { accent: true }), p("M13.5 5 10.5 19", [[45, 16]])],
    "target": [c(12, 12, 8.5, [[13, 9], [62, 9]]), c(12, 12, 4.5, [[22, 16]]), dot(12, 12, 1.4, { accent: true })],
    "lightbulb": [p("M8.4 15.4a5.5 5.5 0 1 1 7.2 0c-.7.6-1.1 1.2-1.3 2.1H9.7c-.2-.9-.6-1.5-1.3-2.1z", [[14, 9], [58, 9]]), p("M9.5 20h5", null, { accent: true }), p("M10.5 22h3")],
    "zap": [p("M12.7 2.5 4.5 13.5h6.3l-1.5 8 8.2-11h-6.3z", [[14, 9], [58, 9]]), dot(19, 4.5, 1, { accent: true })],

    // ── product / sections ──
    "desktop-download": [rc(3, 4, 18, 12, 2, [[13, 9], [62, 9]]), p("M8 20.5h8"), p("M12 16.5v4"), p("M12 6.5v5", null, { accent: true }), p("M9.3 8.8 12 11.5 14.7 8.8", null, { accent: true })],
    "palette": [p("M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 2-.9 2-1.8 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.5-1.5H16a4.5 4.5 0 0 0 4.5-4.5c0-4.3-3.8-7-8.5-7z", [[13, 9], [60, 9]]), dot(7.8, 11, 1.1, { accent: true }), dot(11.5, 7.8, 1.1), dot(15.8, 10, 1.1, { accent: true })],
    "composition": [rc(3, 3.5, 18, 17, 2.5, [[13, 9], [62, 9]]), dot(7, 8, 1.5, { accent: true }), p("M10.5 8h6.5"), dot(7, 12, 1.5), p("M10.5 12h6.5"), dot(7, 16, 1.5, { accent: true }), p("M10.5 16h6.5")],
    "team": [p("M8.5 3.5 3.8 5.4a1.5 1.5 0 0 0-.85 1.9l.7 2.6a1 1 0 0 0 .95.7H6.5v9.4a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10.5h1.9a1 1 0 0 0 .95-.7l.7-2.6a1.5 1.5 0 0 0-.85-1.9L15.5 3.5", [[13, 9], [60, 9]]), p("M8.5 3.5a3.5 3.5 0 0 0 7 0", null, { accent: true })],
    "ai-extract": [p("M14 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5.5", [[42, 14]]), p("M14 4.5 19 9.5V12", [[40, 14]]), p("M13.5 4.5V10h5", null), p("M17.5 14.3l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z", null, { accent: true, fill: true })],
    "activity": [p("M3 12h4l2.5-7 5 14 2.5-7H21", [[14, 9], [60, 9]], { accent: true })],
    "gauge": [p("M4 16.5a8 8 0 1 1 16 0", [[14, 9], [58, 9]]), p("M12 16.5l3.5-4", null, { accent: true }), dot(12, 16.5, 1.3, { accent: true })],
    "memory": [rc(3, 7, 18, 8, 1.5, [[13, 9], [62, 9]]), p("M6 15v3M10 15v3M14 15v3M18 15v3"), p("M7.5 10.5v2.5M12 10.5v2.5M16.5 10.5v2.5", null, { accent: true })],
    "waveform": [p("M4 10v4", null, { accent: true }), p("M8 6.5v11"), p("M12 4v16", null, { accent: true }), p("M16 6.5v11"), p("M20 10v4", null, { accent: true })],
    "db-dump": [p("M4.5 5.5c0-1.4 3.4-2.5 7.5-2.5s7.5 1.1 7.5 2.5-3.4 2.5-7.5 2.5-7.5-1.1-7.5-2.5z", [[14, 9], [60, 9]]), p("M4.5 5.5v6c0 1.4 3.4 2.5 7.5 2.5", [[42, 14]]), p("M19.5 5.5v5", null), p("M4.5 11.5v6c0 1.3 2.9 2.4 6.6 2.5", [[42, 14]]), p("M17 14.5v5.5", null, { accent: true }), p("M14 17l3 3 3-3", null, { accent: true })],

    // ── projects / deploy / infra ──
    "git-branch": [p("M6 4.5v15", [[45, 16]]), c(6, 4.2, 2.2, [[20, 16]]), c(6, 19.8, 2.2, [[20, 16]]), c(18, 7.2, 2.2, [[20, 16]], { accent: true }), p("M18 9.5v.5a4 4 0 0 1-4 4H8", [[40, 14]], { accent: true })],
    "git-merge": [c(6, 6, 2.2, [[20, 16]]), c(6, 18, 2.2, [[20, 16]]), c(15.2, 6, 2.2, [[20, 16]], { accent: true }), p("M6 8.2v9.6", [[45, 14]]), p("M6 13a7 7 0 0 0 7-7", [[42, 14]], { accent: true })],
    "git-commit": [p("M2.5 12h6", [[52, 16]]), p("M15.5 12h6", [[52, 16]]), c(12, 12, 3.6, [[13, 9], [62, 9]], { accent: true })],
    "git-pull-request": [c(6, 5, 2.2, [[20, 16]]), c(6, 19, 2.2, [[20, 16]]), c(18, 19, 2.2, [[20, 16]], { accent: true }), p("M6 7.2v9.6", [[45, 14]]), p("M18 8v8.8", [[45, 14]]), p("M13 5h3a2 2 0 0 1 2 2v1", [[40, 14]], { accent: true })],
    "server": [rc(3, 4, 18, 6, 1.5, [[13, 9], [62, 9]]), rc(3, 14, 18, 6, 1.5, [[13, 9], [62, 9]]), dot(7, 7, 1, { accent: true }), dot(7, 17, 1, { accent: true }), p("M11 7h6"), p("M11 17h6")],
    "database": [p("M4.5 5.5c0-1.4 3.4-2.5 7.5-2.5s7.5 1.1 7.5 2.5-3.4 2.5-7.5 2.5-7.5-1.1-7.5-2.5z", [[14, 9], [60, 9]]), p("M4.5 5.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6", [[42, 14]], { accent: true }), p("M4.5 11.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6", [[42, 14]])],
    "cloud": [p("M6.5 18.5A4.5 4.5 0 0 1 6 9.6a6 6 0 0 1 11.6 1.4A3.75 3.75 0 0 1 17.5 18.5z", [[14, 9], [60, 9]])],
    "cpu": [rc(6, 6, 12, 12, 2, [[13, 9], [62, 9]]), rc(9.5, 9.5, 5, 5, 1, [[25, 18]], { accent: true }), p("M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5")],
    "hard-drive": [p("M22 12H2", [[45, 14]]), p("M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z", [[12, 9], [58, 9]]), dot(6.5, 16, 1, { accent: true }), p("M10.5 16h6")],
    "shield": [p("M12 2.5 4.5 5.5v6c0 5 3.5 8 7.5 10 4-2 7.5-5 7.5-10v-6z", [[13, 9], [60, 9]]), dot(12, 10, 1.5, { accent: true }), p("M12 11.5v3.5", null, { accent: true })],
    "key": [c(8, 15, 4.5, [[14, 10], [60, 10]], { accent: true }), p("M11.2 11.8 20 3", [[40, 16]]), p("M17 6l2.5 2.5"), p("M20 3l1.5 1.5")],
    "plug": [p("M9 4v5", [[45, 16]], { accent: true }), p("M15 4v5", [[45, 16]], { accent: true }), p("M6.5 9h11v2a5.5 5.5 0 0 1-11 0z", [[14, 9], [58, 9]]), p("M12 16.5V21")],
    "wrench": [p("M16.7 3.6a4.6 4.6 0 0 0-6 6L4.4 15.9a2 2 0 0 0 0 2.8l.9.9a2 2 0 0 0 2.8 0l6.3-6.3a4.6 4.6 0 0 0 6-6l-2.6 2.6-2.4-.6-.6-2.4z", [[13, 9], [60, 9]])],
    "bot": [rc(4, 8, 16, 12, 3, [[13, 9], [62, 9]]), p("M12 4.5V8"), dot(12, 3.4, 1.1, { accent: true }), dot(9, 13, 1.1, { accent: true }), dot(15, 13, 1.1, { accent: true }), p("M9.5 16.5h5")],
    "sparkles": [p("M12 3l1.8 4.8 4.7 1.7-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.7z", [[14, 9], [58, 9]], { accent: true }), p("M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z")],

    // ── calls ──
    "phone": [p("M6.5 3.5 9 4l1 3.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 3.5 1 .5 2.5a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z", [[12, 9], [58, 9]])],
    "phone-off": [p("M6.5 3.5 9 4l1 3.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 3.5 1 .5 2.5a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z", [[12, 9], [58, 9]]), p("M20 4 4 20", [[42, 16]], { accent: true })],
    "phone-missed": [p("M6.5 3.5 9 4l1 3.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 3.5 1 .5 2.5a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z", [[12, 9], [58, 9]]), p("M15.5 3.5 21 9M21 3.5 15.5 9", null, { accent: true })],
    "mic": [rc(9, 3, 6, 11, 3, [[14, 10], [60, 10]]), p("M5.5 11a6.5 6.5 0 0 0 13 0", [[42, 14]], { accent: true }), p("M12 17.5V21"), p("M8.5 21h7")],
    "mic-off": [rc(9, 3, 6, 9, 3, [[14, 10]]), p("M5.5 11a6.5 6.5 0 0 0 9.5 5.2", [[42, 14]]), p("M18.5 11a6.5 6.5 0 0 1-.3 2"), p("M12 17.5V21"), p("M8.5 21h7"), p("M20 4 4 20", [[42, 16]], { accent: true })],
    "video": [rc(3, 6, 13, 12, 2.5, [[14, 10], [62, 10]]), p("m21 8-5 4 5 4z", [[40, 16]], { accent: true })],
    "video-off": [rc(3, 6, 11, 12, 2.5, [[14, 10]]), p("M17 9.5 21 8v8l-3-1.5"), p("M20 4 4 20", [[42, 16]], { accent: true })],
    "screen-share": [rc(2.5, 4.5, 19, 12, 2, [[13, 9], [62, 9]]), p("M8 20.5h8"), p("M12 16.5v4"), p("M12 13V7.5M9.5 10 12 7.5 14.5 10", null, { accent: true })],
    "hand": [p("M9 11V5a1.6 1.6 0 0 1 3.2 0v6", [[45, 14]]), p("M12.2 11V4a1.6 1.6 0 0 1 3.2 0v7", [[45, 14]]), p("M15.4 9a1.6 1.6 0 0 1 3.2 0v6a6 6 0 0 1-12 0v-2a1.6 1.6 0 0 1 3.2 0", [[14, 9]], { accent: true })],
    "volume": [p("M11 5 6.5 9H3v6h3.5L11 19z", [[14, 9], [58, 9]]), p("M15.5 8.5a5 5 0 0 1 0 7", null, { accent: true }), p("M18.5 5.5a9 9 0 0 1 0 13")],
    "message-square": [p("M4 4.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3.5V16.5H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z", [[12, 9], [58, 9]])],
    "messages-square": [p("M3 4h13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3 2.5V13H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", [[12, 9], [58, 9]]), p("M8 15.5v1a1 1 0 0 0 1 1h9l3 2.5V10a1 1 0 0 0-1-1h-1", [[40, 14]], { accent: true })],
    "disc": [c(12, 12, 9, [[13, 9], [62, 9]]), dot(12, 12, 2.6, { accent: true })],

    // ── actions / states ──
    "plus": [p("M12 5v14", [[26, 20]]), p("M5 12h14", [[54, 20]])],
    "x": [p("m18 6-12 12", [[40, 20]]), p("m6 6 12 12", [[40, 20]])],
    "check": [p("M4 12l5 5 11-11", [[42, 14]])],
    "edit": [p("M11 4.5H5.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V13", [[38, 16]]), p("M17.5 3a2 2 0 0 1 2.8 2.8L11.8 14.3l-3.6.9.9-3.6z", [[16, 10]], { accent: true })],
    "copy": [rc(9, 9, 12.5, 12.5, 2.5, [[13, 9], [62, 9]]), p("M5.5 14.5h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1", null, { accent: true })],
    "trash": [p("M4 7h16", [[60, 18]]), p("M9.5 7V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v2"), p("M6 7l.9 12.6A2 2 0 0 0 8.9 21.5h6.2a2 2 0 0 0 2-1.9L18 7", [[42, 12]]), p("M10 11v6M14 11v6", null, { accent: true })],
    "link": [p("M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1L11.4 5.5", [[16, 10]]), p("M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.6-1.6", [[16, 10]], { accent: true })],
    "download": [p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", [[40, 16]]), p("M7 10l5 5 5-5", null, { accent: true }), p("M12 15V3", [[55, 20]])],
    "upload": [p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", [[40, 16]]), p("M7 8l5-5 5 5", null, { accent: true }), p("M12 3v12", [[55, 20]])],
    "external": [p("M18 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.5", [[40, 14]]), p("M15 3h6v6", null, { accent: true }), p("M10 14 21 3", [[45, 18]])],
    "send": [p("M14.5 21.3a.5.5 0 0 0 .94-.02l5.9-17.2a.5.5 0 0 0-.64-.64L3.5 9.34a.5.5 0 0 0-.02.94l7.2 2.9a2 2 0 0 1 1.12 1.11z", [[13, 9], [58, 9]]), p("M20.6 3.4 11 13", [[45, 14]])],
    "reply": [p("M3.5 12H15a5 5 0 0 1 5 5v2", [[42, 14]]), p("M3.5 12 9 7M3.5 12 9 17", null, { accent: true })],
    "mail": [rc(3, 5, 18, 14, 2, [[14, 10], [62, 10]]), p("m3 7 9 7 9-7", [[42, 14]], { accent: true })],
    "paperclip": [p("M20 11.5 11.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.6-7.6", [[16, 10]])],
    "megaphone": [p("M3 11 18 5v13l-6-2.5", [[14, 9]]), p("M3 11v3a1.5 1.5 0 0 0 1.5 1.5H12", [[42, 14]]), p("M7 15.5 8 20", null, { accent: true }), p("M21 9.5v4")],
    "refresh": [p("M21 12a9 9 0 1 1-2.64-6.36", [[30, 12], [66, 12]]), p("M21 3v5.5h-5.5", null, { accent: true })],
    "eye": [p("M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", [[12, 9], [62, 9]]), c(12, 12, 3, [[22, 18]], { accent: true })],
    "eye-off": [p("M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", [[12, 9], [62, 9]]), c(12, 12, 3, [[22, 18]]), p("M4 4 20 20", [[42, 16]], { accent: true })],
    "lock": [rc(4, 11, 16, 10, 2, [[16, 11], [64, 11]]), p("M8 11V7a4 4 0 1 1 8 0v4", [[42, 14]]), dot(12, 16, 1.4, { accent: true })],
    "log-in": [p("M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", [[40, 16]]), p("M10 17l5-5-5-5", null, { accent: true }), p("M15 12H3", [[34, 22]])],
    "log-out": [p("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", [[40, 16]]), p("M16 17l5-5-5-5", null, { accent: true }), p("M21 12H9", [[34, 22]])],
    "user-plus": [c(9, 7.5, 4, [[15, 14]]), p("M2.5 20.5v-1a5.5 5.5 0 0 1 5.5-5.5h2", [[42, 14]]), p("M17 13v6M14 16h6", null, { accent: true })],
    "user-x": [c(9, 7.5, 4, [[15, 14]]), p("M2.5 20.5v-1a5.5 5.5 0 0 1 5.5-5.5h2", [[42, 14]]), p("M15 14l5 5M20 14l-5 5", null, { accent: true })],
    "crown": [p("M3 7l4 4 5-6 5 6 4-4-2 11H5z", [[14, 9], [58, 9]]), p("M5 20.5h14", null, { accent: true })],
    "grip": [dot(9, 6, 1.4), dot(15, 6, 1.4), dot(9, 12, 1.4, { accent: true }), dot(15, 12, 1.4, { accent: true }), dot(9, 18, 1.4), dot(15, 18, 1.4)],
    "more-h": [dot(5, 12, 1.8), dot(12, 12, 1.8), dot(19, 12, 1.8)],
    "more-v": [dot(12, 5, 1.8), dot(12, 12, 1.8), dot(12, 19, 1.8)],
    "chevron-right": [p("m9 18 6-6-6-6", [[42, 16]])],
    "chevron-left": [p("m15 18-6-6 6-6", [[42, 16]])],
    "chevron-down": [p("m6 9 6 6 6-6", [[42, 16]])],
    "chevron-up": [p("m6 15 6-6 6 6", [[42, 16]])],
    "arrow-left": [p("M19 12H5", [[30, 18]]), p("M5 12 11 6M5 12 11 18", null, { accent: true })],
    "arrow-right": [p("M5 12h14", [[30, 18]]), p("M19 12 13 6M19 12 13 18", null, { accent: true })],
    "arrow-up": [p("M12 19V5", [[30, 18]]), p("M12 5 6 11M12 5 18 11", null, { accent: true })],
    "info": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M12 11.5V16"), dot(12, 8.2, 1.1, { accent: true })],
    "alert": [p("M10.3 4.5 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z", [[14, 9], [60, 9]]), p("M12 9.5v4.5"), dot(12, 17.2, 1.1, { accent: true })],
    "help-circle": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M9.2 9.5a2.8 2.8 0 0 1 5.3 1c0 2-2.7 2.5-2.7 4", null, { accent: true }), dot(12, 17, 1.1, { accent: true })],
    "sun": [c(12, 12, 4.5, [[20, 14]]), p("M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2", null, { accent: true }), p("M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4")],
    "moon": [p("M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z", [[13, 9], [60, 9]])],

    // ── text editor / rich toolbar ──
    "bold": [p("M7 4.5h6a3.75 3.75 0 0 1 0 7.5H7z", [[13, 9], [58, 9]]), p("M7 12h7.5a3.75 3.75 0 0 1 0 7.5H7z", [[13, 9], [58, 9]], { accent: true })],
    "italic": [p("M11 4.5h8", [[52, 16]]), p("M5 19.5h8", [[52, 16]]), p("M14.5 4.5 9.5 19.5", [[45, 14]], { accent: true })],
    "underline": [p("M6.5 4.5v6.5a5.5 5.5 0 0 0 11 0V4.5", [[42, 14]]), p("M5 20.5h14", [[54, 16]], { accent: true })],
    "strikethrough": [p("M4 12h16", [[54, 16]], { accent: true }), p("M16 6.5H9.5a3 3 0 0 0-2.4 4.8", [[40, 14]]), p("M13.5 13a4 4 0 0 1-1.5 7.5H7", [[40, 14]])],
    "list-bulleted": [p("M9 6.5h11", [[55, 14]]), p("M9 12h11", [[16, 14]]), p("M9 17.5h11", [[55, 14]]), dot(4.5, 6.5, 1.3, { accent: true }), dot(4.5, 12, 1.3, { accent: true }), dot(4.5, 17.5, 1.3, { accent: true })],
    "list-numbered": [p("M10 6.5h10", [[55, 14]]), p("M10 12h10", [[16, 14]]), p("M10 17.5h10", [[55, 14]]), p("M3.5 5v3.5M3 5h1M3 8.5h1.4", null, { accent: true }), p("M3 11.2a1 1 0 0 1 1.6.8c0 .8-1.6 1.3-1.6 2.5h1.7", null, { accent: true }), p("M3.1 16.6a1 1 0 1 1 1.3 1.3.9.9 0 0 1-1.3 1.3", null, { accent: true })],
    "list-todo": [p("M10 6.5h10", [[55, 14]]), p("M10 17.5h10", [[55, 14]]), rc(3, 4.3, 4.4, 4.4, 1.2, [[15, 12]]), p("M3.9 15.6l1.1 1.1 2.1-2.3", null, { accent: true })],
    "quote": [c(7.5, 8, 2.8, [[16, 12]]), p("M10.3 8.5c0 4-1.2 6-4 7", [[42, 14]]), c(16, 8, 2.8, [[16, 12]], { accent: true }), p("M18.8 8.5c0 4-1.2 6-4 7", [[42, 14]], { accent: true })],
    "code-inline": [p("M9 8 5 12l4 4", [[42, 14]], { accent: true }), p("M15 8 19 12l-4 4", [[42, 14]], { accent: true })],
    "code-block": [rc(3, 4.5, 18, 15, 2, [[13, 9], [62, 9]]), p("M9 10.5 6.5 13 9 15.5", [[42, 14]], { accent: true }), p("M15 10.5 17.5 13 15 15.5", [[42, 14]], { accent: true })],
    "heading-1": [p("M4 6v12", [[45, 14]]), p("M12 6v12", [[45, 14]]), p("M4 12h8", [[52, 14]], { accent: true }), p("M17 10l2.2-1.3V18", null, { accent: true })],
    "heading-2": [p("M4 6v12", [[45, 14]]), p("M12 6v12", [[45, 14]]), p("M4 12h8", [[52, 14]], { accent: true }), p("M16.3 10a1.8 1.8 0 0 1 3.2 1.1c0 1.9-3.2 2.6-3.2 4.6h3.4", null, { accent: true })],
    "heading-3": [p("M4 6v12", [[45, 14]]), p("M12 6v12", [[45, 14]]), p("M4 12h8", [[52, 14]], { accent: true }), p("M16.3 9.8a1.7 1.7 0 0 1 3 1.1 1.6 1.6 0 0 1-1.7 1.6 1.7 1.7 0 0 1 1.9 1.7 1.9 1.9 0 0 1-3.3 1.3", null, { accent: true })],
    "link-add": [p("M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1L11.4 5.5", [[16, 10]]), p("M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.6-1.6", [[16, 10]], { accent: true })],
    "divider": [p("M4 12h16", [[54, 16]], { accent: true }), p("M6 6.5h12", [[58, 22]]), p("M6 17.5h12", [[58, 22]])],
    "highlighter": [p("M9 11l4-4 4 4-4 4z", [[14, 9]]), p("M13 7l3-3 4 4-3 3", [[40, 14]], { accent: true }), p("M9 11l-2 2v3h3l2-2", [[42, 14]]), p("M5 20.5h6", null, { accent: true })],
    "indent": [p("M4 6.5h16", [[58, 16]]), p("M10 12h10", [[55, 14]]), p("M4 17.5h16", [[58, 16]]), p("M4 10l3 2-3 2", null, { accent: true })],
    "outdent": [p("M4 6.5h16", [[58, 16]]), p("M10 12h10", [[55, 14]]), p("M4 17.5h16", [[58, 16]]), p("M7 10l-3 2 3 2", null, { accent: true })],
    "image": [rc(3, 4.5, 18, 15, 2.5, [[13, 9], [62, 9]]), c(8.5, 9.5, 1.8, [[22, 16]], { accent: true }), p("M4 17l4.5-4.5a2 2 0 0 1 2.8 0L17 18", [[42, 14]]), p("M14.5 15.5l2-2a2 2 0 0 1 2.8 0l1.2 1.2", null, { accent: true })],
    "file-add": [p("M13 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.5z", [[13, 9], [60, 9]]), p("M13 3.5V9.5h5.5", [[42, 14]]), p("M12 12.5v5M9.5 15h5", null, { accent: true })],
    "attachment": [p("M20 11.5 11.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.6-7.6", [[16, 10]], { accent: true })],
    "table": [rc(3, 4.5, 18, 15, 2, [[13, 9], [62, 9]]), p("M3 10h18", [[42, 16]], { accent: true }), p("M3 15h18", [[42, 16]]), p("M9 10v9.5", [[45, 16]]), p("M15 10v9.5", [[45, 16]], { accent: true })],
    "emoji-insert": [c(12, 12, 9, [[13, 9], [62, 9]]), p("M8.5 14a4.5 4.5 0 0 0 7 0", [[42, 14]], { accent: true }), dot(9, 10, 1.15), dot(15, 10, 1.15)],
    "subscript": [p("M5 6l7 9M12 6l-7 9", [[42, 14]]), p("M17 18.5c0-1.2 3-1.4 3-3a1.5 1.5 0 0 0-2.7-.9M17 18.5h3", null, { accent: true })],
    "superscript": [p("M5 9l7 9M12 9l-7 9", [[42, 14]]), p("M17 8c0-1.2 3-1.4 3-3a1.5 1.5 0 0 0-2.7-.9M17 8h3", null, { accent: true })],
    "align-left": [p("M4 6h16", [[58, 16]]), p("M4 12h10", [[52, 14]], { accent: true }), p("M4 18h13", [[58, 16]])],
    "align-center": [p("M4 6h16", [[58, 16]]), p("M7 12h10", [[52, 14]], { accent: true }), p("M5.5 18h13", [[58, 16]])],
    "align-right": [p("M4 6h16", [[58, 16]]), p("M10 12h10", [[52, 14]], { accent: true }), p("M7 18h13", [[58, 16]])],
    "align-justify": [p("M4 6h16", [[58, 16]]), p("M4 12h16", [[16, 16]], { accent: true }), p("M4 18h16", [[58, 16]])],
    "clear-format": [p("M5 7V4.5h14V7", [[42, 14]]), p("M12 4.5 8.5 15", [[45, 14]]), p("M6 18.5h6", [[54, 16]]), p("M15 15l5 5M20 15l-5 5", null, { accent: true })],
    "collapse": [p("M9 6l6 6-6 6", [[42, 16]], { accent: true }), p("M4.5 4.5v15", [[45, 16]])],
    "mention": [c(12, 12, 4, [[20, 14]], { accent: true }), p("M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1", [[16, 10]])],
    "task-link": [p("M9.5 4 7.5 20", [[45, 14]]), p("M16.5 4 14.5 20", [[45, 14]]), p("M5 9.5h14", [[52, 14]], { accent: true }), p("M4.5 14.5h14", [[52, 14]], { accent: true })],

    // ── active / toggled states ──
    "check-circle-active": [c(12, 12, 8.5, null, { activeFill: true, masked: true }), { t: "hole", d: "M8.3 12.2l2.4 2.4 4.9-5.4", sw: 2.3 }],
    "star-active": [p("m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.8l-5.8 3 1.1-6.4L2.6 9.8l6.5-.9z", null, { activeFill: true })],
    "bell-active": [p("M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z", null, { activeFill: true }), p("M10 19a2 2 0 0 0 4 0")],
    "play": [p("M8 5.5v13a1 1 0 0 0 1.5.9l11-6.5a1 1 0 0 0 0-1.8l-11-6.5A1 1 0 0 0 8 5.5z", [[14, 10], [62, 10]])],
    "pause": [rc(6.5, 5, 4, 14, 1.3, null, { activeFill: true }), rc(13.5, 5, 4, 14, 1.3, null, { activeFill: true })],

    // ── new: attachments & file types ──
    "file": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]])],
    "file-up": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), p("M12 12v6", null, { accent: true }), p("m9 15 3-3 3 3", null, { accent: true })],
    "file-image": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), c(10, 12.5, 1.6, [[22, 16]], { accent: true }), p("m20 17-1.3-1.3a2.4 2.4 0 0 0-3.4 0L9.5 21.5", [[42, 14]], { accent: true })],
    "file-video": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), p("M9.5 13v6l5-3z", null, { accent: true })],
    "file-audio": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), p("M9 18.5v-6l3 1.4", [[42, 14]], { accent: true }), c(7.2, 18.5, 1.6, [[22, 16]], { accent: true })],
    "file-archive": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), p("M9 6v1M9 10v1M9 14v1", null, { accent: true }), c(9, 19, 1.6, [[22, 16]], { accent: true })],
    "file-spreadsheet": [p(FB, [[13, 9], [58, 9]]), p(FF, [[42, 14]]), p("M8 13h2M14 13h2M8 17h2M14 17h2", null, { accent: true })],
    "presentation": [p("M2 3.5h20", [[58, 14]]), p("M21 3.5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11", [[13, 9], [60, 9]]), p("m7 21 5-5 5 5", null, { accent: true })],
    "music": [p("M9 18V5l12-2v13", [[45, 14]]), c(6, 18, 3, [[20, 16]]), c(18, 16, 3, [[20, 16]])],

    // ── new: absences / status badges ──
    "palmtree": [p("M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4", [[42, 14]]), p("M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3", [[42, 14]]), p("M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35", [[13, 9], [60, 9]]), p("M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14", [[42, 14]])],
    "plane": [p("M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z", [[13, 9], [58, 9]])],
    "pill": [p("m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z", [[13, 9], [58, 9]]), p("m8.5 8.5 7 7", null, { accent: true })],
    "thermometer": [p("M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z", [[13, 9], [58, 9]]), p("M12 10v5", null, { accent: true })],
    "briefcase": [p("M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", [[42, 14]], { accent: true }), rc(2, 6, 20, 14, 2, [[13, 9], [62, 9]])],
    "cake": [p("M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8", [[13, 9], [58, 9]]), p("M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1", [[45, 14]]), p("M2 21h20", [[58, 14]]), p("M7 8.5v2.5M12 8.5v2.5M17 8.5v2.5"), dot(7, 4.7, 1, { accent: true }), dot(12, 4.7, 1, { accent: true }), dot(17, 4.7, 1, { accent: true })],

    // ── new: calls / devices ──
    "phone-outgoing": [p("M6.5 3.5 9 4l1 3.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 3.5 1 .5 2.5a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z", [[12, 9], [58, 9]]), p("M16 8.5 21.5 3", null, { accent: true }), p("M17 3h4.5v4.5", null, { accent: true })],
    "phone-incoming": [p("M6.5 3.5 9 4l1 3.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 3.5 1 .5 2.5a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z", [[12, 9], [58, 9]]), p("M21.5 3 16 8.5", null, { accent: true }), p("M16.5 4v4.5h4.5", null, { accent: true })],
    "screen-share-off": [p("M13 3.5H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5", [[13, 9], [58, 9]]), p("M8 20.5h8"), p("M12 16.5v4"), p("M22 3.5l-5 5", null, { accent: true }), p("M17 3.5l5 5", null, { accent: true })],
    "monitor-off": [p("M17 16.5H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 1.2-1.83", [[42, 14]]), p("M8.7 3.5H20a2 2 0 0 1 2 2v9a2 2 0 0 1-.3 1.05", [[42, 14]]), p("M8 20.5h8"), p("M12 16.5v4"), p("M2.5 2.5 21.5 21.5", [[45, 14]], { accent: true })],
    "captions": [rc(3, 5, 18, 14, 2, [[13, 9], [62, 9]]), p("M7 15h4M15 15h2M7 11h2M13 11h4", null, { accent: true })],
    "signal-low": [p("M4 20.5v-2", null, { accent: true }), p("M9 20.5v-5", null, { accent: true }), p("M14 20.5v-9"), p("M19 20.5v-14")],
    "zoom-in": [c(11, 11, 8, [[13, 9], [62, 9]]), p("m20.5 20.5-3.7-3.7"), p("M11 8v6M8 11h6", null, { accent: true })],
    "zoom-out": [c(11, 11, 8, [[13, 9], [62, 9]]), p("m20.5 20.5-3.7-3.7"), p("M8 11h6", null, { accent: true })],
    "user-check": [c(9, 7, 4, [[15, 14]]), p("M2.5 20.5v-1.5a4.5 4.5 0 0 1 4.5-4.5h3.5", [[42, 14]]), p("M15 12.5 17 14.5 21 10.5", null, { accent: true })],
    "monitor": [rc(2, 3, 20, 14, 2, [[13, 9], [62, 9]]), p("M8 21h8"), p("M12 17v4")],
    "smartphone": [rc(5, 2, 14, 20, 3, [[13, 9], [62, 9]]), dot(12, 18, 1, { accent: true })],
    "app-window": [rc(2, 4, 20, 16, 2, [[13, 9], [62, 9]]), p("M2 8.5h20", [[42, 16]]), dot(5.5, 6.2, 0.9, { accent: true }), dot(8.5, 6.2, 0.9, { accent: true })],
    "bell-off": [p("M6 8a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z", [[14, 10], [60, 10]]), p("M10 19a2 2 0 0 0 4 0"), p("M20 4 4 20", [[42, 16]], { accent: true })],

    // ── new: chat / feed ──
    "check-check": [p("M2 12.5 7 17.5 17 6.5", [[42, 14]]), p("M13 16.5 14.5 18 22 9.5", null, { accent: true })],
    "pin-off": [p("M9.3 3h5.4l-.6 6 3.4 3.5V14H6.5v-1.5L9.9 9z", [[14, 10], [62, 10]]), p("M12 14v7.5"), p("M4 4 20 20", [[42, 16]], { accent: true })],
    "hash": [p("M4 9h16", [[58, 14]]), p("M4 15h16", [[58, 14]]), p("M10 3 8 21", [[45, 14]]), p("M16 3 14 21", [[45, 14]])],
    "dot": [dot(12, 12, 2)],

    // ── new: tasks / projects / admin ──
    "circle-x": [c(12, 12, 8.5, [[13, 9], [62, 9]]), p("M15 9 9 15", null, { accent: true }), p("M9 9 15 15", null, { accent: true })],
    "x-circle": [c(12, 12, 8.5, [[13, 9], [62, 9]]), p("M15 9 9 15", null, { accent: true }), p("M9 9 15 15", null, { accent: true })],
    "octagon-x": [p("M2.6 16.7A2 2 0 0 1 2 15.3V8.7a2 2 0 0 1 .6-1.4l4.7-4.7A2 2 0 0 1 8.7 2h6.6a2 2 0 0 1 1.4.6l4.7 4.7a2 2 0 0 1 .6 1.4v6.6a2 2 0 0 1-.6 1.4l-4.7 4.7a2 2 0 0 1-1.4.6H8.7a2 2 0 0 1-1.4-.6z", [[13, 9], [62, 9]]), p("M15 9 9 15", null, { accent: true }), p("M9 9 15 15", null, { accent: true })],
    "git-pull-request-closed": [c(6, 6, 2.2, [[20, 16]]), p("M6 8.2v10", [[45, 14]]), c(18, 18, 2.2, [[20, 16]]), p("M18 11.5v4.3"), p("M21 3 15.5 8.5", null, { accent: true }), p("M15.5 3 21 8.5", null, { accent: true })],
    "workflow": [rc(3, 3, 8, 8, 2, [[15, 12]]), p("M7 11v4a2 2 0 0 0 2 2h4", [[42, 14]], { accent: true }), rc(13, 13, 8, 8, 2, [[15, 12]])],
    "user-pen": [c(10, 7, 4, [[15, 14]]), p("M11.5 15H7a4 4 0 0 0-4 4v2", [[42, 14]]), p("M21.4 16.6a1.4 1.4 0 0 0-3-3l-4 4a2 2 0 0 0-.5.85l-.85 2.87a.5.5 0 0 0 .62.62l2.87-.85a2 2 0 0 0 .85-.5z", [[16, 10]], { accent: true })],
    "user-cog": [c(9, 7, 4, [[15, 14]]), p("M10 15H6a4 4 0 0 0-4 4v2", [[42, 14]]), c(18, 15, 2.6, [[22, 16]], { accent: true }), p("M18 11.4v-1M18 19.6v-1M21.9 12.7l.9-.5M13.3 17.3l.9-.5M21.9 17.3l.9.5M13.3 12.7l.9.5", null, { accent: true })],
    "chevrons-up-down": [p("m7 15 5 5 5-5", [[42, 14]]), p("m7 9 5-5 5 5", [[42, 14]])],
    "minus": [p("M5 12h14", [[54, 20]])],
    "square": [rc(3, 3, 18, 18, 3, [[13, 9], [62, 9]])],
    "unlink": [p("M18.84 12.25 20.56 10.54a5 5 0 0 0-.12-7.07 5 5 0 0 0-6.95 0l-1.72 1.71", [[16, 10]]), p("M5.17 11.75 3.46 13.46a5 5 0 0 0 .12 7.07 5 5 0 0 0 6.95 0l1.71-1.71", [[16, 10]]), p("M8 2v3M2 8h3M16 19v3M19 16h3", null, { accent: true })],
    "train": [p("M8 3.1V7a4 4 0 0 0 8 0V3.1", [[42, 14]]), p("M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z", [[13, 9], [60, 9]]), p("m9 15-1-1", null, { accent: true }), p("m15 15 1-1", null, { accent: true }), p("m8 19-2 3"), p("m16 19 2 3")],
    "dollar-sign": [p("M12 2.5v19", [[45, 14]]), p("M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", [[42, 14]])],

    // ── new: documents / folders ──
    "folder-open": [p("m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2", [[13, 9], [58, 9]])],
    "folder-plus": [p("M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z", [[13, 9], [58, 9]]), p("M12 11.5v5M9.5 14h5", null, { accent: true })],
    "folder-input": [p("M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1", [[13, 9], [60, 9]]), p("M2 13h10", [[45, 14]], { accent: true }), p("m9 16 3-3-3-3", null, { accent: true })],
    "folder-tree": [p("M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z", [[13, 9], [60, 9]]), p("M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z", [[42, 14]]), p("M3 5a2 2 0 0 0 2 2h3", null, { accent: true }), p("M3 3v13a2 2 0 0 0 2 2h3", [[45, 14]], { accent: true })],
};

export const ANIM: Record<string, AnimCfg> = {
    menu: { mode: "draw", stagger: 150 },
    columns: { mode: "draw", stagger: 150 },
    "layout-grid": { mode: "draw", stagger: 130 },
    "list-checks": { mode: "draw", stagger: 110 },
    waveform: { mode: "draw", stagger: 120 },
    server: { mode: "draw", stagger: 140 },
    code: { mode: "draw", stagger: 220 },
    "code-inline": { mode: "draw", stagger: 220 },
    "code-block": { mode: "draw", stagger: 200 },
    "arrow-left": { mode: "draw", seq: 300 },
    "arrow-right": { mode: "draw", seq: 300 },
    "arrow-up": { mode: "draw", seq: 300 },
    reply: { mode: "draw", seq: 320 },
    loading: { mode: "spin", deg: 300, dur: 700 },
    refresh: { mode: "spin", deg: 200 },
    settings: { mode: "draw" },
    "status-done": { mode: "draw" },
    "status-canceled": { mode: "draw" },
    "check-circle": { mode: "draw" },
    "check-circle-active": { mode: "pop" },
    "star-active": { mode: "pop" },
    "bell-active": { mode: "pop" },
    "priority-urgent": { mode: "draw" },
    check: { mode: "draw" },
    x: { mode: "draw" },
    plus: { mode: "draw" },
    sparkles: { mode: "draw", stagger: 200 },
    zap: { mode: "draw" },
    captions: { mode: "draw", stagger: 120 },
    "signal-low": { mode: "draw", seq: 120 },
    hash: { mode: "draw", stagger: 140 },
    workflow: { mode: "draw", stagger: 160 },
    cake: { mode: "draw", stagger: 120 },
    "check-check": { mode: "draw", seq: 260 },
    "file-up": { mode: "draw", stagger: 120 },
    "circle-x": { mode: "draw" },
    "x-circle": { mode: "draw" },
    "octagon-x": { mode: "draw" },
};

export type IconName = keyof typeof ICONS;

// Zones that should render as a full SOLID outline by default (no broken-outline
// cuts) unless the caller overrides. In the component:
//   const solid = solidProp ?? SOLID_BY_DEFAULT.includes(name);
// and when solid is true, ignore `gaps` and use dash "100 0".
export const SOLID_BY_DEFAULT: string[] = [
  // calls / devices
  "phone", "phone-off", "phone-missed", "phone-outgoing", "phone-incoming",
  "mic", "mic-off", "video", "video-off", "screen-share", "screen-share-off",
  "monitor-off", "captions", "signal-low", "hand", "volume", "disc", "play", "pause",
  // task statuses
  "status-backlog", "status-todo", "status-progress", "status-done", "status-canceled",
];

