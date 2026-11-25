import { describe, expect, it } from "vitest";
import { placeLabels } from "./labels";

const label = (id: string) => ({ id, width: 40, height: 16 });

describe("placeLabels", () => {
  it("centres a lone label on the longest segment", () => {
    const routes = {
      e: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
        { x: 200, y: 20 },
      ],
    };
    expect(placeLabels([label("e")], routes, [])).toEqual({ e: { x: 100, y: 20 } });
  });

  it("keeps two labels on a shared line apart, both still on the line", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 0, y: 300 },
    ];
    const at = placeLabels([label("a"), label("b")], { a: line, b: line }, []);
    expect(at.a?.x).toBe(0);
    expect(at.b?.x).toBe(0);
    expect(Math.abs((at.a?.y ?? 0) - (at.b?.y ?? 0))).toBeGreaterThanOrEqual(16);
  });

  it("slides away from a node sitting on the midpoint", () => {
    const routes = {
      e: [
        { x: 0, y: 0 },
        { x: 0, y: 300 },
      ],
    };
    const node = { x: -50, y: 130, width: 100, height: 40 };
    const at = placeLabels([label("e")], routes, [node]).e;
    expect(at?.x).toBe(0);
    expect(at?.y === 150).toBe(false);
  });

  it("skips edges without a route", () => {
    expect(placeLabels([label("e")], {}, [])).toEqual({});
  });
});
