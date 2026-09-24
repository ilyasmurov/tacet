// Tests for the text controller. jsdom has neither the Web Animations API nor
// path measuring, so part of the tests runs as is (the instant path), and part
// stands in for the browser with fakes that finish every animation on the next
// tick — enough to check which glyphs a transition keeps and where it lands.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXT_TIMING, createText } from "./text.js";
import { textLayout, textMarkup } from "./textLayout.js";

const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};
const glyphs = (host: Element) => Array.from(host.querySelectorAll("svg.tc-glyph"));
const chars = (host: Element) => glyphs(host).map((svg) => svg.getAttribute("data-char")).join("");

function newHost(): HTMLElement {
  const host = document.createElement("span");
  document.body.appendChild(host);
  return host;
}

type Loose = Record<string, unknown>;

/** One call of the fake `animate`: on what, which keyframes, with which timing. */
interface Played {
  el: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
}

/**
 * Stands in for a browser: animations finish on the next tick, a stroke measures 10 units.
 * Every call lands in `played`, so a test can read the choreography.
 */
function installMotion(played: Played[] = []): () => void {
  const element = Element.prototype as unknown as Loose;
  const svg = SVGElement.prototype as unknown as Loose;
  const saved = element["animate"];
  element["animate"] = function fakeAnimate(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    played.push({ el: this, frames, options });
    const listeners: Array<() => void> = [];
    let cancelled = false;
    setTimeout(() => {
      if (!cancelled) for (const fn of listeners) fn();
    }, 0);
    return {
      cancel() { cancelled = true; },
      addEventListener(_type: string, fn: () => void) { listeners.push(fn); },
    };
  };
  svg["getTotalLength"] = () => 10;
  return () => {
    if (saved) element["animate"] = saved;
    else delete element["animate"];
    delete svg["getTotalLength"];
  };
}

beforeEach(() => {
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("without the Web Animations API", () => {
  it("draws exactly the markup textMarkup gives", () => {
    const host = newHost();
    createText(host, "Привет, мир!", { size: 32 });
    expect(host.innerHTML).toBe(textMarkup("Привет, мир!", { size: 32 }));
  });

  it("a new text is drawn at once", () => {
    const host = newHost();
    const text = createText(host, "Черновик");
    text.set("Опубликовано");
    expect(text.value).toBe("ОПУБЛИКОВАНО");
    expect(host.innerHTML).toBe(textMarkup("Опубликовано"));
  });

  it("leaves the host's own attributes to the caller", () => {
    const host = newHost();
    createText(host, "Сохраняю…");
    expect(host.getAttribute("role")).toBeNull();
    expect(host.getAttribute("aria-label")).toBeNull();
  });
});

describe("transitions", () => {
  let restore: () => void;
  beforeEach(() => { restore = installMotion(); });
  afterEach(() => restore());

  it("erase keeps the common head and tail as the same elements", async () => {
    const host = newHost();
    const text = createText(host, "СОХРАНЯЮ…");
    const before = glyphs(host);
    text.set("СОХРАНЕНО");
    const during = glyphs(host);
    for (let i = 0; i < 6; i++) expect(during[i], `glyph ${i}`).toBe(before[i]);
    await flush();
    expect(chars(host)).toBe("СОХРАНЕНО");
    expect(host.querySelector("mask")).toBeNull();
    expect(host.innerHTML).toBe(textMarkup("СОХРАНЕНО"));
  });

  it("erase leaves the gone glyphs in place while they collapse", () => {
    const host = newHost();
    const text = createText(host, "ЗАГРУЗКА");
    text.set("ЗА");
    expect(chars(host).startsWith("ЗА")).toBe(true);
    expect(glyphs(host).length).toBeGreaterThan(2);
  });

  it("a whole word erases where it stands, and only then the gap closes and the new one writes in", () => {
    // TACET-63: the gone glyphs used to collapse their width while still drawn;
    // their drawing does not shrink with the box, so a whole word piled up.
    const played: Played[] = [];
    restore();
    restore = installMotion(played);
    const host = newHost();
    const text = createText(host, "Черновик");
    const old = glyphs(host);
    text.set("Опубликовано");
    const fresh = glyphs(host).filter((svg) => !old.includes(svg));
    const widthOf = (svg: Element) => played.find((call) => call.el === svg && call.frames.some((frame) => "width" in frame));

    for (const svg of old) expect(widthOf(svg)?.options.delay, "collapse").toBe(TEXT_TIMING.erase);
    for (const svg of fresh) {
      const grow = widthOf(svg);
      expect(grow?.options.delay, "grow").toBe(TEXT_TIMING.erase);
      // Held at zero while it waits: at full width the tail would jump out and back.
      expect(grow?.options.fill).toBe("both");
    }
    const strokes = played.filter((call) => fresh.some((svg) => svg.contains(call.el)) && call.frames.some((frame) => "strokeDashoffset" in frame));
    expect(Math.min(...strokes.map((call) => Number(call.options.delay)))).toBe(TEXT_TIMING.erase + TEXT_TIMING.lag);
  });

  it("append drops the gone glyphs at once", () => {
    const host = newHost();
    const text = createText(host, "ЗАГРУЗКА", { transition: "append" });
    text.set("ЗАГОН");
    expect(chars(host)).toBe("ЗАГОН");
  });

  it("rewrite keeps nothing", async () => {
    const host = newHost();
    const text = createText(host, "10:30", { transition: "rewrite" });
    const before = glyphs(host);
    text.set("10:45");
    const after = glyphs(host);
    for (const svg of before) expect(after.slice(before.length)).not.toContain(svg);
    await flush();
    expect(chars(host)).toBe("10:45");
  });

  it("a kept glyph takes the width its new neighbour gives it", async () => {
    const host = newHost();
    const text = createText(host, "TH");
    const t = glyphs(host)[0]!;
    text.set("TA");
    const expected = textLayout("TA").words[0]![0]!.svgAttrs;
    expect(glyphs(host)[0]).toBe(t);
    expect(t.getAttribute("width")).toBe(String(expected["width"]));
    expect(t.getAttribute("viewBox")).toBe(expected["viewBox"]);
    await flush();
  });

  it("a new text mid-flight cuts the running one short", async () => {
    const host = newHost();
    const text = createText(host, "ЧЕРНОВИК");
    text.set("ОПУБЛИКОВАНО");
    text.set("ГОТОВО!");
    await flush();
    expect(chars(host)).toBe("ГОТОВО!");
    expect(host.innerHTML).toBe(textMarkup("ГОТОВО!"));
  });

  it("new words bring their space", async () => {
    const host = newHost();
    const text = createText(host, "3 задачи");
    text.set("12 задач");
    await flush();
    expect(host.innerHTML).toBe(textMarkup("12 задач"));
  });
});

describe("options", () => {
  it("a new size redraws at once", () => {
    const host = newHost();
    const text = createText(host, "ABC", { size: 24 });
    text.update({ size: 48 });
    expect(host.innerHTML).toBe(textMarkup("ABC", { size: 48 }));
  });

  it("destroy leaves the text drawn still", () => {
    const host = newHost();
    const text = createText(host, "ABC");
    text.destroy();
    expect(host.innerHTML).toBe(textMarkup("ABC"));
  });
});
