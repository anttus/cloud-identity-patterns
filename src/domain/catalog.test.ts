import { describe, expect, it } from "vitest";
import { findCatalogErrors } from "./catalog";
import type { Comparison, Pattern } from "./schema";

const pattern = (id: string, extra: Partial<Pattern> = {}): Pattern => ({
  id,
  type: "pattern",
  provider: "generic",
  title: id,
  summary: "",
  notes: [],
  docs: [],
  graph: { nodes: [], edges: [] },
  ...extra,
});
const comparison = (id: string, patterns: string[]): Comparison => ({
  id,
  title: id,
  topic: "General",
  summary: "",
  patterns,
  dimensions: [],
  notes: [],
});

describe("findCatalogErrors", () => {
  it("accepts a warning fixed by a pattern", () => {
    const patterns = [pattern("good"), pattern("bad", { type: "warning", fixedBy: "good" })];
    expect(findCatalogErrors({ patterns, comparisons: [] })).toEqual([]);
  });

  it("rejects fixedBy pointing nowhere", () => {
    const patterns = [pattern("bad", { type: "warning", fixedBy: "missing" })];
    expect(findCatalogErrors({ patterns, comparisons: [] })).toHaveLength(1);
  });

  it("rejects a warning fixed by another warning", () => {
    const patterns = [
      pattern("a", { type: "warning" }),
      pattern("b", { type: "warning", fixedBy: "a" }),
    ];
    expect(findCatalogErrors({ patterns, comparisons: [] })).toHaveLength(1);
  });

  it("rejects comparisons referencing unknown patterns", () => {
    const errors = findCatalogErrors({
      patterns: [pattern("a")],
      comparisons: [comparison("c", ["a", "zzz"])],
    });
    expect(errors).toEqual([`comparison "c" references unknown pattern "zzz"`]);
  });
});
