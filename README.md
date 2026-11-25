<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="Cloud Identity Patterns logo: a cloud with a key">
</p>

<h1 align="center">Cloud Identity Patterns</h1>

Interactive diagrams of cloud identity patterns across Azure, AWS, Google Cloud and Kubernetes: workload identity federation, Kubernetes workload identity, cross-account roles, API gateway authentication, RBAC, PIM, etc. It includes side-by-side comparisons and anti-patterns.

Static single-page app with no backend and no secrets. All content is data files.

## Run

```bash
docker build -t cloud-identity-patterns .
docker run --rm -p 8080:8080 cloud-identity-patterns
```

Open http://localhost:8080. The container runs nginx as a non-root user and serves static files with a strict CSP. There is a health endpoint at `/healthz`.

## Develop

Requires Node 22.12+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run lint     # biome
npm run build    # typecheck + production build to dist/
```

## Structure

```
src/
  domain/       schema (Zod), validation, catalog checks, routing, ELK layout, visuals. No React.
  catalog/
    patterns/     one JSON file per pattern or anti-pattern
    comparisons/  one JSON file per side-by-side comparison
  components/   sidebar, React Flow canvas, comparison view, details panels
```

## Content types

| Type | File | Shown as |
|---|---|---|
| Pattern | `catalog/patterns/*.json`, `"type": "pattern"` (default) | Diagram, grouped by `provider` in the sidebar |
| Basics pattern | `catalog/patterns/*.json`, `"basics": true` | High-level overview of a platform's identity building blocks; listed first in its sidebar group with a "Basics" badge, and on the home page |
| Anti-pattern | `catalog/patterns/*.json`, `"type": "warning"` | Warning banner; risky nodes/edges carry a `warning` text and render in red; optional `fixedBy` links to the safe pattern |
| Comparison | `catalog/comparisons/*.json` | 2–4 patterns as side-by-side columns plus a dimension table, grouped in the sidebar by `topic` (e.g. Kubernetes, CI/CD) |

Every view has a URL (`#/pattern/<id>`, `#/compare/<id>`), so views can be bookmarked and shared.

## Data model

Everything is an `IdentityGraph` of typed nodes and edges (see `src/domain/schema.ts`):

- **Principals:** user, group, appRegistration, servicePrincipal, userAssignedIdentity, systemAssignedIdentity, iamRole, serviceAccount, k8sServiceAccount
- **Trust and authorization:** externalIssuer, identityProvider, federatedCredential, roleBinding, roleDefinition, credential
- **Other:** workload, scope (subscription, account, project, namespace, resource…)
- **Edges:** federatesWith, hasRoleAssignment, isEligibleFor (PIM), canAssume (AssumeRole / impersonation), runsAs, uses, subjectOf, grants, scopedTo, memberOf, owns, attachedTo, childOf, instanceOf

Bundled files go through `parsePattern()` / `parseComparison()`, the same validation a user-supplied file will use. `findCatalogErrors()` then checks the links between files. A bad file fails `npm test` and the build.

## Add content

Drop a JSON file into `src/catalog/patterns/` or `src/catalog/comparisons/`. It's picked up automatically.

## Disclaimer

This is an educational reference, not security advice for any specific environment. Cloud identity features change often: check the linked vendor documentation before applying a pattern, and review access changes with whoever owns your environment.

The diagrams are simplified on purpose. They show the parts of each pattern that decide who can act as whom, and leave out networking, logging and most configuration details.

## Trademarks

Microsoft, Azure, Microsoft Entra, Amazon Web Services, AWS, Amazon EKS, Google Cloud, GKE, Kubernetes, GitHub, HashiCorp Vault, SPIFFE and SPIRE are trademarks of their respective owners. They are used here only to identify the platforms each pattern applies to.

This project is not affiliated with, sponsored by or endorsed by Microsoft, Amazon, Google, the Cloud Native Computing Foundation, the Linux Foundation, GitHub or HashiCorp. The sidebar icons are simplified original drawings, not official logos.

## Third-party software

The built app bundles these open-source packages. `npm run build` writes their full license texts to `dist/THIRD-PARTY-LICENSES.txt`, which the Docker image serves at `/THIRD-PARTY-LICENSES.txt`. The list is generated from what actually ends up in the bundle, so it stays current when dependencies change.

| Package | License |
|---|---|
| [React](https://github.com/facebook/react), React DOM, scheduler, react-compiler-runtime | MIT |
| [React Flow (@xyflow/react, @xyflow/system)](https://github.com/xyflow/xyflow), plus its dependencies zustand and classcat | MIT |
| [Zod](https://github.com/colinhacks/zod) | MIT |
| [d3](https://github.com/d3/d3) modules used by React Flow | ISC, BSD-3-Clause |
| [elkjs](https://github.com/kieler/elkjs) | EPL-2.0 (used under EPL-2.0; dual-licensed EPL-2.0 OR GPL-3.0-or-later) |

elkjs is used unmodified. Its source code is available at https://github.com/kieler/elkjs, and the Eclipse Public License 2.0 is at https://www.eclipse.org/legal/epl-2.0/. The EPL-2.0 applies only to elkjs, not to this project's own code.

The Docker image is based on [nginxinc/nginx-unprivileged](https://github.com/nginxinc/docker-nginx-unprivileged) (nginx is BSD-2-Clause).

## License

The source code and the pattern catalog are released under the [MIT License](LICENSE).

Copyright (c) 2026 Anttu Suhonen
