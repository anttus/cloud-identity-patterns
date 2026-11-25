import { Comparison, IdentityGraph, Pattern } from "./schema";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

/**
 * Structural checks Zod can't express on its own: ids must be unique and
 * every edge must point at nodes that exist. Returns human-readable errors.
 */
export const findReferenceErrors = (graph: IdentityGraph): string[] => {
  const errors: string[] = [];

  // Collect all node ids first so edges are checked against the complete set.
  const nodeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) errors.push(`duplicate node id "${node.id}"`);
    nodeIds.add(node.id);
  }

  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) errors.push(`duplicate edge id "${edge.id}"`);
    edgeIds.add(edge.id);
    // Report source and target separately so both problems surface in one pass.
    for (const end of ["source", "target"] as const) {
      if (!nodeIds.has(edge[end])) {
        errors.push(`edge "${edge.id}" ${end} "${edge[end]}" is not a known node`);
      }
    }
  }

  return errors;
};

const formatZodIssues = (issues: { path: PropertyKey[]; message: string }[]): string[] =>
  issues.map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`);

export const parseGraph = (input: unknown): Result<IdentityGraph> => {
  const parsed = IdentityGraph.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodIssues(parsed.error.issues) };
  const refErrors = findReferenceErrors(parsed.data);
  return refErrors.length ? { ok: false, errors: refErrors } : { ok: true, value: parsed.data };
};

export const parseComparison = (input: unknown): Result<Comparison> => {
  const parsed = Comparison.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, errors: formatZodIssues(parsed.error.issues) };
};

export const parsePattern = (input: unknown): Result<Pattern> => {
  const parsed = Pattern.safeParse(input);
  if (!parsed.success) return { ok: false, errors: formatZodIssues(parsed.error.issues) };
  const refErrors = findReferenceErrors(parsed.data.graph);
  return refErrors.length ? { ok: false, errors: refErrors } : { ok: true, value: parsed.data };
};
