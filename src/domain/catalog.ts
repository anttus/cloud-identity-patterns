import type { Comparison, Pattern, Provider } from "./schema";

export type Catalog = { patterns: Pattern[]; comparisons: Comparison[] };

/** Cross-file links that per-file validation can't see. */
export const findCatalogErrors = ({ patterns, comparisons }: Catalog): string[] => {
  const errors: string[] = [];
  const byId = new Map<string, Pattern>();
  for (const p of patterns) {
    if (byId.has(p.id)) errors.push(`duplicate pattern id "${p.id}"`);
    byId.set(p.id, p);
  }
  for (const p of patterns) {
    if (!p.fixedBy) continue;
    const fix = byId.get(p.fixedBy);
    if (p.type !== "warning") errors.push(`pattern "${p.id}" has fixedBy but is not a warning`);
    if (!fix) errors.push(`pattern "${p.id}" fixedBy "${p.fixedBy}" does not exist`);
    else if (fix.type === "warning") errors.push(`pattern "${p.id}" is fixed by another warning`);
  }
  const comparisonIds = new Set<string>();
  for (const c of comparisons) {
    if (comparisonIds.has(c.id)) errors.push(`duplicate comparison id "${c.id}"`);
    comparisonIds.add(c.id);
    for (const id of c.patterns) {
      if (!byId.has(id)) errors.push(`comparison "${c.id}" references unknown pattern "${id}"`);
    }
  }
  return errors;
};

/** Comparisons with this topic are shown with the basics patterns, not under Comparisons. */
export const BASICS_TOPIC = "Basics";

/** Comparison topics in sidebar order: these first, the rest alphabetically. */
const TOPIC_ORDER = [BASICS_TOPIC, "Kubernetes"];

export const compareTopics = (a: string, b: string): number => {
  const rank = (t: string) => {
    const i = TOPIC_ORDER.indexOf(t);
    return i < 0 ? TOPIC_ORDER.length : i;
  };
  return rank(a) - rank(b) || a.localeCompare(b);
};

/**
 * Sort comparator: overview ("basics") patterns first, then by `order` if set.
 * Patterns without `order` keep their existing relative order (Array.sort is stable).
 */
export const basicsFirst = (a: Pattern, b: Pattern): number =>
  Number(b.basics) - Number(a.basics) ||
  (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);

export const providerLabels: Record<Provider, string> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "Google Cloud",
  kubernetes: "Kubernetes",
  generic: "General",
};

/** Lower-case and strip accents, so "entra" matches "Entra" and "e" matches "é". */
const fold = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * True when every word of `query` appears somewhere in `text` (in any order).
 * An empty or blank query matches everything.
 */
export const matchesQuery = (text: string, query: string): boolean => {
  const haystack = fold(text);
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/** What the sidebar search looks at for a pattern: title, summary and platform. */
export const patternSearchText = (p: Pattern): string =>
  [p.title, p.summary, providerLabels[p.provider], p.provider].join(" ");

/** What the sidebar search looks at for a comparison: title, summary and topic. */
export const comparisonSearchText = (c: Comparison): string =>
  [c.title, c.summary, c.topic].join(" ");
