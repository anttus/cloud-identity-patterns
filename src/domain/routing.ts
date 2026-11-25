import type { Catalog } from "./catalog";

export type View = { type: "pattern"; id: string } | { type: "comparison"; id: string };

const prefixes = { pattern: "#/pattern/", comparison: "#/compare/" } as const;

export const viewToHash = (view: View): string =>
  `${prefixes[view.type]}${encodeURIComponent(view.id)}`;

/**
 * Turns `location.hash` back into a View. The hash is user-controlled input,
 * so anything malformed or unknown yields null (the caller then shows a default).
 */
export const parseHash = (hash: string, catalog: Catalog): View | null => {
  for (const type of ["pattern", "comparison"] as const) {
    const prefix = prefixes[type];
    if (!hash.startsWith(prefix)) continue;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(prefix.length));
    } catch {
      return null; // malformed percent-encoding, e.g. "%E0%A4%A"
    }
    // Look the id up only in the list for this type, so a comparison id
    // can't be opened as a pattern (or vice versa).
    const list = type === "pattern" ? catalog.patterns : catalog.comparisons;
    return list.some((x) => x.id === id) ? { type, id } : null;
  }
  return null;
};
