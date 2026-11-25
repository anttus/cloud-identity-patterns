import { describe, expect, it } from "vitest";
import { catalog } from "./index";

// Importing the catalog runs every file through validation; a bad file throws here.
describe("bundled catalog", () => {
  it("loads patterns, warnings and comparisons", () => {
    expect(catalog.patterns.some((p) => p.type === "pattern")).toBe(true);
    expect(catalog.patterns.some((p) => p.type === "warning")).toBe(true);
    expect(catalog.comparisons.length).toBeGreaterThan(0);
  });

  it("marks at least one element in every warning", () => {
    for (const p of catalog.patterns.filter((x) => x.type === "warning")) {
      const marked = [...p.graph.nodes, ...p.graph.edges].some((x) => x.warning);
      expect(marked, p.id).toBe(true);
    }
  });
});
