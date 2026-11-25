# AGENTS.md

Context for AI coding agents (and humans) working on **Cloud Identity Patterns**: a static web app with interactive diagrams of identity patterns across Azure, AWS, Google Cloud and Kubernetes, plus side-by-side comparisons and anti-patterns. Read this first; [README.md](README.md) covers the same ground for users.

## At a glance

- **What it is:** a static single-page app with no backend, no secrets and no runtime data fetching. All content is JSON in `src/catalog/`.
- **Stack:** Vite 8, React 19, TypeScript 7 (strict), React Flow (`@xyflow/react` 13), elkjs 0.12 (layout), Zod 4 (validation), Vitest 5, Biome 2.
- **Package manager:** npm (not pnpm or yarn). Node 22.12+.
- **Ships as:** a Docker image with unprivileged nginx on port 8080, a strict CSP, and `/healthz`.
- **Repo:** https://github.com/anttus/cloud-identity-patterns (MIT).

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # vitest (also validates every catalog file)
npm run lint      # biome check: must report 0 errors and 0 warnings
npm run format    # biome format --write
npm run build     # tsc -b && vite build → dist/ (incl. THIRD-PARTY-LICENSES.txt)
docker build -t cloud-identity-patterns . && docker run --rm -p 8080:8080 cloud-identity-patterns
```

Before calling a change done, run **lint, `npx tsc --noEmit`, test and build**. For UI changes, also look at it in a browser at desktop (≈1440 px) and phone (375 px) widths.

## Layout of the code

```
src/
  domain/        pure TypeScript, no React. Unit-tested.
    schema.ts      Zod schemas: node/edge kinds, Pattern, Comparison. The data contract.
    parse.ts       parsePattern / parseComparison / parseGraph + reference checks
    catalog.ts     cross-file checks (findCatalogErrors), sort helpers, provider labels
    routing.ts     hash routes ⇄ View
    layout.ts      ELK layered layout → node positions, edge routes, label positions
    labels.ts      collision-free edge label placement (on the edge's own route)
    visuals.ts     labels and colours per node/edge kind (CSS variables)
  catalog/
    patterns/      one JSON file per pattern or anti-pattern
    comparisons/   one JSON file per side-by-side comparison
    index.ts       loads + validates everything at build time; throws on bad data
  components/    React views: Sidebar, Home, GraphView (+ RoutedEdge, IdentityNodeView),
                 ComparisonView, DetailsPanel, PanelToggle, ResizeHandle, SectionIcon
  App.tsx        routing, panel state (collapse + width), view resolution
  styles.css     all styles; colour tokens on :root with dark-mode overrides
public/favicon.svg   logo (also used in README and the sidebar header)
vite.config.ts       React plugin + third-party license file generator
nginx.conf           CSP and security headers, /healthz, SPA fallback
```

## Content model (most tasks are content tasks)

Everything is an `IdentityGraph` of typed **nodes** and **edges** (`src/domain/schema.ts`). Adding content means adding a JSON file; it's picked up automatically by `import.meta.glob`.

**Node kinds:** `user`, `group`, `appRegistration`, `servicePrincipal`, `userAssignedIdentity`, `systemAssignedIdentity`, `iamRole`, `serviceAccount` (cloud SA, e.g. GCP), `externalIssuer`, `identityProvider`, `federatedCredential`, `k8sServiceAccount`, `roleBinding` (any binding: Azure role assignment, AWS account assignment, K8s RoleBinding), `roleDefinition` (any permission set: Azure role, IAM policy, permission set, K8s Role), `credential` (stored long-lived secret; renders red), `workload`, `scope`.

**Edge kinds** (direction matters, `source → target`): `federatesWith` (target trusts source's tokens), `hasRoleAssignment` (principal → scope, `properties.role`), `isEligibleFor` (PIM), `canAssume`, `memberOf`, `owns`, `attachedTo`, `runsAs`, `uses`, `subjectOf` (principal → binding), `grants` (binding/role → permission set), `scopedTo` (binding/policy → scope), `childOf` (child → parent), `instanceOf`.

### Pattern file

```jsonc
{
  "id": "aks-workload-identity",        // same as the file name; used in URLs (#/pattern/<id>), so renaming breaks links
  "provider": "azure",                   // azure | aws | gcp | kubernetes | generic
  "type": "pattern",                     // or "warning" for an anti-pattern (default "pattern")
  "basics": false,                       // true = high-level overview, shown in the sidebar's Basics group
  "order": 1,                            // optional position among siblings (used for basics)
  "fixedBy": "k8s-rbac",                 // warnings only: id of the safe pattern
  "title": "AKS Workload Identity",
  "summary": "One or two sentences.",
  "notes": ["3–5 key points, each a full sentence."],
  "docs": [{ "title": "…", "url": "https://learn.microsoft.com/…" }],
  "graph": {
    "nodes": [{ "id": "ksa", "kind": "k8sServiceAccount", "label": "orders/orders-sa",
                "description": "optional", "properties": { "k": "v" }, "warning": "optional, renders red" }],
    "edges": [{ "id": "e1", "kind": "runsAs", "source": "pod", "target": "ksa", "label": "optional" }]
  }
}
```

### Comparison file

`id`, `title`, `topic` (sidebar group: `Basics`, `Kubernetes`, `CI/CD`, …), `summary`, `patterns` (2–4 pattern ids, shown as columns), `dimensions` (`{ label, values[] }` with **exactly one value per pattern, in the same order**), `notes`. Comparisons with `"topic": "Basics"` appear under the sidebar's Basics group, not under Comparisons.

### What validation enforces

Both `npm test` and the build (the catalog loads at build time) fail if:

- a file doesn't match the schema, or a comparison's dimension value counts don't match its patterns;
- node or edge ids repeat within a graph, or an edge points at a missing node;
- pattern or comparison ids repeat across files;
- a comparison references an unknown pattern;
- `fixedBy` is set on a non-warning, points at an unknown id, or points at another warning.

`npm test` additionally fails if a warning pattern marks no node or edge with `warning`. Keep each `id` equal to its file name; nothing enforces this, but every current file follows it.

## Content guidelines

- **Accuracy over breadth.** Describe how the platform actually behaves; when unsure, check the vendor docs. Notes are your own words, never copied text.
- **Docs links: first-party only** (Microsoft Learn, AWS docs, Google Cloud docs, kubernetes.io, istio.io, GitHub Docs, HashiCorp, spiffe.io, official project repos). Use the current URL, not one that redirects (Google Cloud docs now live on `docs.cloud.google.com`), and check links that point at a `#section`.
- **Diagrams read top to bottom:** where trust starts (people, issuers, workloads) at the top, what it reaches (roles, scopes, resources) at the bottom. The layout places each node below whatever points to it, so **edge direction decides the shape**. If a diagram comes out wide and flat, flip edges (e.g. `role → grants → policy`, not `policy → attachedTo → role`).
- Keep diagrams to roughly **5–11 nodes**. Keep node labels short (they truncate) and edge labels to a few words.
- Anti-patterns: put the `warning` on the specific risky node or edge, explain the fix in `notes`, and set `fixedBy`.
- Plain, clear English; full sentences in notes and summaries.

## Code conventions

- **Domain logic stays in `src/domain/`**, pure and unit-tested. Components only render.
- **The URL hash is the only routing state:** `#/` home, `#/pattern/<id>`, `#/compare/<id>`. Unknown or malformed hashes fall back to home. Don't add a router library.
- **Trust boundary:** all content goes through the Zod parsers in `parse.ts`, including future user imports. Validate there, not in components.
- **Styling:** plain CSS in `styles.css`. Use the colour tokens (`--fg`, `--bg`, `--accent`, `--c-*`); every new colour needs a dark-mode value. Prefer class selectors; Biome's `noDescendingSpecificity` warns when a later selector is less specific than an earlier one with the same ending.
- **Accessibility:** real `<button>`/`<a>` elements, visible `:focus-visible` styles, `aria-*` on custom controls (see `PanelToggle`, `ResizeHandle`), and `prefers-reduced-motion` respected.
- **UI preferences** (panel open/closed, widths) live in `localStorage` under the `cip.` prefix, always wrapped in try/catch, and are never required for the app to work.
- **Formatting and linting:** Biome with the recommended preset. Keep it at zero warnings.

## Gotchas (learned the hard way)

- **CSP:** nginx serves `default-src 'self'` without `'unsafe-eval'`. Zod is set to `z.config({ jitless: true })` in `schema.ts` for that reason; don't remove it. No external scripts, fonts or images; inline SVG is fine.
- **React Flow needs handles** on nodes to draw edges. They're invisible and inert (`.id-handle`), and the graph is read-only (no dragging, connecting or reconnecting). Don't remove them.
- **Diagram sizing:** nodes have a fixed size (`NODE_WIDTH`/`NODE_HEIGHT` in `layout.ts`) passed to both ELK and React Flow, so `fitView` works before the DOM is measured. When the canvas size changes (panel toggled or resized), the diagrams are re-keyed to re-fit, once per change, not on every drag frame.
- **Edge labels** are placed by `placeLabels` (`labels.ts`) on the edge's own route, avoiding nodes and other labels. Don't switch back to ELK's label placement: it spreads diagrams out and moves labels off their lines.
- **Static asset paths:** files in `public/` are referenced as `/favicon.svg`. If the app is ever served under a sub-path, set `base: "./"` in `vite.config.ts` and use `import.meta.env.BASE_URL` in JSX.
- **License file:** the minifier strips license comments, so `vite.config.ts` writes `dist/THIRD-PARTY-LICENSES.txt` from the packages actually in the bundle. elkjs is used under EPL-2.0 (dual-licensed with GPL-3.0). Keep the README's third-party section in sync with new runtime dependencies.

## Git and safety

- **Conventional commits:** `feat(scope): add …`, lowercase and imperative; types `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. **No `Co-Authored-By` or other AI attribution lines.**
- **Commit or push only when the user asks.** The `origin` remote uses SSH.
- **Never commit secrets** or machine-specific paths. `.claude/` is git-ignored for that reason.
- **Don't touch the user's Kubernetes cluster** (`kubectl`, `helm` or API calls). For deployment problems, explain and give commands for the user to run.
- Deployment examples (Deployment, Service, Istio VirtualService) aren't stored in the repo. The image runs as uid 101 on port 8080, works with a read-only root filesystem if `/tmp` is a writable `emptyDir`, and needs no service account token.

## Roadmap

- **A (done):** curated patterns, basics, comparisons, anti-patterns, home page.
- **B:** import a JSON graph (e.g. built from `az` / `aws` / `gcloud` output, or Cartography / AzureHound data) and render it locally in the browser, validated by the same parsers.
- **C:** a live read-only tenant explorer (MSAL.js, PKCE, delegated read scopes).
- **Content gaps:** Google Cloud basics (IAM, Cloud Identity, Workforce Identity Federation), OAuth flows with numbered steps, on-behalf-of (OBO), Azure Lighthouse, AWS permission boundaries / SCPs (needs a deny edge kind).
