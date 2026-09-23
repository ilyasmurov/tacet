// Tests for the digits controller. jsdom has neither the Web Animations API nor
// path measuring, so part of the tests runs as is (the instant path), and part
// stands in for the browser with fakes that finish every animation on the next
// tick — enough to check where each transition lands.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { createDigits } from "./digits.js";
import { digitsMarkup } from "./digitsLayout.js";
import { BODY_CLASS } from "./renderSpec.js";

const glyph = (n: string) => (ICONS as unknown as Record<string, IconDef>)[`digit-${n}`]![0]!.d!;
const chars = (host: Element) => Array.from(host.children).map((el) => el.getAttribute("data-char"));
const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

function newHost(): HTMLElement {
  const host = document.createElement("span");
  document.body.appendChild(host);
  return host;
}

type Loose = Record<string, unknown>;

/**
 * Stands in for a browser: animations finish on the next tick, a frame arrives
 * long after any duration, a contour measures as a straight line.
 */
function installMotion(): () => void {
  const element = Element.prototype as unknown as Loose;
  const svg = SVGElement.prototype as unknown as Loose;
  const saved = {
    animate: element["animate"],
    raf: globalThis.requestAnimationFrame,
    caf: globalThis.cancelAnimationFrame,
  };
  element["animate"] = function fakeAnimate() {
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
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now() + 60_000), 0)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
  svg["getTotalLength"] = () => 100;
  svg["getPointAtLength"] = (at: number) => ({ x: at / 10, y: 12 });
  return () => {
    if (saved.animate) element["animate"] = saved.animate;
    else delete element["animate"];
    globalThis.requestAnimationFrame = saved.raf;
    globalThis.cancelAnimationFrame = saved.caf;
    delete svg["getTotalLength"];
    delete svg["getPointAtLength"];
  };
}

beforeEach(() => {
  document.body.textContent = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("still numbers", () => {
  it("one slot per character", () => {
    const host = newHost();
    const digits = createDigits(host, "12:30");
    expect(chars(host)).toEqual(["1", "2", ":", "3", "0"]);
    expect(digits.value).toBe("12:30");
  });

  it("builds the same DOM the static markup describes", () => {
    const live = newHost();
    createDigits(live, 1248, { size: 32 });
    const still = document.createElement("span");
    still.innerHTML = digitsMarkup(1248, { size: 32 });
    expect(live.children.length).toBe(still.children.length);
    for (let i = 0; i < live.children.length; i++) {
      const a = live.children[i]!;
      const b = still.children[i]!;
      for (const name of ["viewBox", "width", "height", "data-char", "class", "aria-hidden"]) {
        expect(a.getAttribute(name), name).toBe(b.getAttribute(name));
      }
      expect(a.querySelector(`g.${BODY_CLASS}`)!.innerHTML).toBe(b.querySelector(`g.${BODY_CLASS}`)!.innerHTML);
    }
  });

  it("drops what a number cannot show", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = newHost();
    createDigits(host, "1 2");
    expect(chars(host)).toEqual(["1", "2"]);
  });
});

describe("without the Web Animations API", () => {
  it("a new value is drawn at once", () => {
    const host = newHost();
    const digits = createDigits(host, "9");
    digits.set(10);
    expect(chars(host)).toEqual(["1", "0"]);
    expect(host.querySelector("mask")).toBeNull();
  });
});

describe("options", () => {
  it("a change to the drawing redraws the number", () => {
    const host = newHost();
    const digits = createDigits(host, "42", { variant: "D" });
    const before = host.children[0];
    digits.update({ variant: "A" });
    expect(host.children[0]).not.toBe(before);
    // A: no accent spans, one path per digit.
    expect(host.querySelectorAll(`g.${BODY_CLASS} path`).length).toBe(2);
  });

  it("a change of transition alone leaves the drawing be", () => {
    const host = newHost();
    const digits = createDigits(host, "42");
    const before = host.children[0];
    digits.update({ transition: "relay" });
    expect(host.children[0]).toBe(before);
  });

  it("destroy leaves the number drawn still", () => {
    const host = newHost();
    const digits = createDigits(host, "7");
    digits.destroy();
    expect(chars(host)).toEqual(["7"]);
  });
});

describe("transitions", () => {
  let restore: () => void = () => {};
  beforeEach(() => {
    restore = installMotion();
  });
  afterEach(() => {
    restore();
  });

  it.each(["morph", "relay", "erase"] as const)("%s ends on the exact glyph, with no masks left", async (transition) => {
    const host = newHost();
    const digits = createDigits(host, "3", { transition });
    digits.set("8");
    await flush();
    const bodies = host.querySelectorAll(`g.${BODY_CLASS}`);
    expect(bodies.length).toBe(1);
    // The exact contour, not the polyline a morph flies through.
    expect(bodies[0]!.querySelector("path")!.getAttribute("d")).toBe(glyph("8"));
    expect(host.querySelector("mask")).toBeNull();
    expect(host.querySelector("[mask]")).toBeNull();
    expect(chars(host)).toEqual(["8"]);
  });

  it("only the digits that changed are touched", async () => {
    const host = newHost();
    const digits = createDigits(host, "12:30");
    const bodies = Array.from(host.querySelectorAll(`g.${BODY_CLASS}`));
    digits.set("12:31");
    await flush();
    const after = Array.from(host.querySelectorAll(`g.${BODY_CLASS}`));
    expect(after.slice(0, 4)).toEqual(bodies.slice(0, 4));
    expect(after[4]).not.toBe(bodies[4]);
  });

  it("a longer number grows on the left, a shorter one gives the room back", async () => {
    const host = newHost();
    const digits = createDigits(host, "9");
    digits.set("10");
    // The new slot is there at once; the old one already names the digit it morphs into.
    expect(chars(host)).toEqual(["1", "0"]);
    await flush();
    expect(chars(host)).toEqual(["1", "0"]);

    digits.set("9");
    await flush();
    expect(chars(host)).toEqual(["9"]);
  });

  it("a value set mid-flight wins", async () => {
    const host = newHost();
    const digits = createDigits(host, "3", { transition: "relay" });
    digits.set("4");
    digits.set("5");
    await flush();
    expect(chars(host)).toEqual(["5"]);
    expect(host.querySelector(`g.${BODY_CLASS} path`)!.getAttribute("d")).toBe(glyph("5"));
    expect(host.querySelector("mask")).toBeNull();
  });

  it("reduced motion draws the new value at once", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    const host = newHost();
    const digits = createDigits(host, "3");
    digits.set("8");
    expect(host.querySelector(`g.${BODY_CLASS} path`)!.getAttribute("d")).toBe(glyph("8"));
    vi.unstubAllGlobals();
  });
});
