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

export const providerLabels: Record<Provider, string> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "Google Cloud",
  kubernetes: "Kubernetes",
  generic: "General",
};
