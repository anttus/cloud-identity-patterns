import { describe, expect, it } from "vitest";
import { findReferenceErrors, parseGraph } from "./parse";
import type { IdentityGraph } from "./schema";

const graph = (g: Partial<IdentityGraph>): IdentityGraph => ({ nodes: [], edges: [], ...g });
const node = (id: string) => ({ id, kind: "user" as const, label: id });
const edge = (id: string, source: string, target: string) => ({
  id,
  kind: "memberOf" as const,
  source,
  target,
});

describe("findReferenceErrors", () => {
  it("accepts a well-formed graph", () => {
    expect(
      findReferenceErrors(graph({ nodes: [node("a"), node("b")], edges: [edge("e", "a", "b")] })),
    ).toEqual([]);
  });

  it("reports duplicate node ids", () => {
    expect(findReferenceErrors(graph({ nodes: [node("a"), node("a")] }))).toHaveLength(1);
  });

  it("reports duplicate edge ids", () => {
    const g = graph({
      nodes: [node("a"), node("b")],
      edges: [edge("e", "a", "b"), edge("e", "b", "a")],
    });
    expect(findReferenceErrors(g)).toHaveLength(1);
  });

  it("reports dangling source and target separately", () => {
    expect(findReferenceErrors(graph({ edges: [edge("e", "x", "y")] }))).toHaveLength(2);
  });
});

describe("parseGraph", () => {
  it("rejects unknown node kinds with a path in the message", () => {
    const result = parseGraph({ nodes: [{ id: "a", kind: "wizard", label: "A" }], edges: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/^nodes\.0\.kind/);
  });

  it("rejects non-object input", () => {
    expect(parseGraph("nope").ok).toBe(false);
  });
});
