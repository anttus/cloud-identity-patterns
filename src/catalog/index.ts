import { type Catalog, findCatalogErrors } from "../domain/catalog";
import { parseComparison, parsePattern, type Result } from "../domain/parse";

// Bundled content goes through the same validation as future user imports.
const patternFiles = import.meta.glob<{ default: unknown }>("./patterns/*.json", { eager: true });
const comparisonFiles = import.meta.glob<{ default: unknown }>("./comparisons/*.json", {
  eager: true,
});

const loadAll = <T>(
  files: Record<string, { default: unknown }>,
  parse: (x: unknown) => Result<T>,
): T[] =>
  Object.entries(files).map(([path, mod]) => {
    const result = parse(mod.default);
    if (!result.ok) throw new Error(`Invalid ${path}:\n${result.errors.join("\n")}`);
    return result.value;
  });

export const catalog: Catalog = {
  patterns: loadAll(patternFiles, parsePattern),
  comparisons: loadAll(comparisonFiles, parseComparison),
};

const errors = findCatalogErrors(catalog);
if (errors.length) throw new Error(`Invalid catalog:\n${errors.join("\n")}`);
