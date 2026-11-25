import { describe, expect, it } from "vitest";
import {
  basicsFirst,
  compareTopics,
  findCatalogErrors,
  matchesQuery,
  patternSearchText,
} from "./catalog";
import type { Comparison, Pattern } from "./schema";

const pattern = (id: string, extra: Partial<Pattern> = {}): Pattern => ({
  id,
  type: "pattern",
  provider: "generic",
  title: id,
  summary: "",
  notes: [],
  docs: [],
  basics: false,
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

describe("ordering", () => {
  it("lists Basics, then Kubernetes, then other topics alphabetically", () => {
    expect(["CI/CD", "Zeta", "Kubernetes", "Basics"].sort(compareTopics)).toEqual([
      "Basics",
      "Kubernetes",
      "CI/CD",
      "Zeta",
    ]);
  });

  it("puts basics patterns first and keeps the rest in order", () => {
    const list = [pattern("a"), pattern("b", { basics: true }), pattern("c")];
    expect(list.sort(basicsFirst).map((p) => p.id)).toEqual(["b", "a", "c"]);
  });

  it("orders basics by their order field", () => {
    const list = [
      pattern("x", { basics: true, order: 2 }),
      pattern("y", { basics: true, order: 1 }),
    ];
    expect(list.sort(basicsFirst).map((p) => p.id)).toEqual(["y", "x"]);
  });
});

describe("matchesQuery", () => {
  it("matches everything when the query is blank", () => {
    expect(matchesQuery("anything", "")).toBe(true);
    expect(matchesQuery("anything", "   ")).toBe(true);
  });
  it("ignores case and accents", () => {
    expect(matchesQuery("Entra ID", "entra")).toBe(true);
    expect(matchesQuery("Café", "CAFE")).toBe(true);
  });
  it("needs every word, in any order", () => {
    expect(matchesQuery("AKS Workload Identity", "identity aks")).toBe(true);
    expect(matchesQuery("AKS Workload Identity", "aks eks")).toBe(false);
  });
  it("finds a pattern by its platform name", () => {
    const p = pattern("gke", { provider: "gcp", title: "GKE Workload Identity" });
    expect(matchesQuery(patternSearchText(p), "google workload")).toBe(true);
  });
});
