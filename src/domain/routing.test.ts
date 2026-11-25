import { describe, expect, it } from "vitest";
import type { Catalog } from "./catalog";
import { parseHash, viewToHash } from "./routing";

const catalog = {
  patterns: [{ id: "uami-vs-sami" }],
  comparisons: [{ id: "cicd-federation" }],
} as unknown as Catalog;

describe("parseHash", () => {
  it("round-trips home, pattern and comparison views", () => {
    for (const view of [
      { type: "home" },
      { type: "pattern", id: "uami-vs-sami" },
      { type: "comparison", id: "cicd-federation" },
    ] as const) {
      expect(parseHash(viewToHash(view), catalog)).toEqual(view);
    }
  });

  it("rejects unknown ids", () => {
    expect(parseHash("#/pattern/nope", catalog)).toBeNull();
  });

  it("does not resolve a comparison id as a pattern", () => {
    expect(parseHash("#/pattern/cicd-federation", catalog)).toBeNull();
  });

  it("rejects malformed encoding and junk", () => {
    expect(parseHash("#/pattern/%E0%A4%A", catalog)).toBeNull();
    expect(parseHash("#/whatever", catalog)).toBeNull();
  });

  it("treats an empty or bare hash as the home page", () => {
    for (const hash of ["", "#", "#/"]) {
      expect(parseHash(hash, catalog)).toEqual({ type: "home" });
    }
  });
});
