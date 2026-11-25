import { z } from "zod";

// No runtime code generation: keeps the strict CSP (no 'unsafe-eval') free of violations.
z.config({ jitless: true });

/**
 * Identity graph model.
 *
 * `IdentityGraph` is the single exchange format: curated patterns (phase A)
 * embed one, and imported snapshots (phase B) will be one. Anything entering
 * the app — bundled or user-supplied — goes through `parseGraph` /
 * `parsePattern`, so validation lives at exactly one trust boundary.
 *
 * Kinds are cloud-neutral where the concept is shared (scope, workload,
 * externalIssuer) and specific where the distinction is the lesson
 * (userAssignedIdentity vs systemAssignedIdentity).
 */

export const NodeKind = z.enum([
  "user",
  "group",
  "appRegistration",
  "servicePrincipal",
  "userAssignedIdentity",
  "systemAssignedIdentity",
  /** AWS IAM role: an assumable identity with a trust policy and permission policies. */
  "iamRole",
  /** Cloud service account (e.g. GCP), as opposed to a Kubernetes one. */
  "serviceAccount",
  "externalIssuer",
  /** IdP registered inside a cloud (AWS IAM OIDC provider, GCP workload identity pool provider). */
  "identityProvider",
  "k8sServiceAccount",
  /** Binds subjects to a role (Kubernetes RoleBinding, EKS access entry or pod identity association). */
  "roleBinding",
  /** A named set of permissions (Kubernetes Role / ClusterRole, EKS access policy). */
  "roleDefinition",
  /**
   * Trust record on an identity: accepts tokens from one issuer for one subject and
   * audience (Azure federated identity credential). Not a secret.
   */
  "federatedCredential",
  /** A stored long-lived secret or key. */
  "credential",
  "workload",
  "scope",
]);
export type NodeKind = z.infer<typeof NodeKind>;

export const EdgeKind = z.enum([
  /** Federation trust: target trusts tokens from source (issuer/subject/audience). */
  "federatesWith",
  /** Active permission grant: principal → scope, `properties.role` names the role or policy. */
  "hasRoleAssignment",
  /** PIM eligibility: principal → scope (with `properties.role`) or → group (eligible membership). */
  "isEligibleFor",
  /** Principal may become another principal (sts:AssumeRole, GCP SA impersonation). */
  "canAssume",
  "memberOf",
  "owns",
  /** Identity or credential attached to a resource, workload or app. */
  "attachedTo",
  /** Authenticates as a principal (e.g. pod uses a service account). */
  "runsAs",
  /** Reads or calls something without becoming it (e.g. a job reading a stored secret). */
  "uses",
  /** Principal is a subject of a binding. */
  "subjectOf",
  /** Binding references a role definition. */
  "grants",
  /** Binding or definition is limited to this scope. */
  "scopedTo",
  /** Containment: child inherits from parent (scope tree, role in account). */
  "childOf",
  /** Service principal is the tenant-local instance of an app registration. */
  "instanceOf",
]);
export type EdgeKind = z.infer<typeof EdgeKind>;

const Id = z.string().min(1).max(200);
const Properties = z.record(z.string(), z.string()).optional();
/** Why this element is risky. Rendered in the warning colour. */
const Warning = z.string().min(1).max(1000).optional();

export const IdentityNode = z.object({
  id: Id,
  kind: NodeKind,
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  properties: Properties,
  warning: Warning,
});
export type IdentityNode = z.infer<typeof IdentityNode>;

export const IdentityEdge = z.object({
  id: Id,
  kind: EdgeKind,
  source: Id,
  target: Id,
  label: z.string().max(200).optional(),
  properties: Properties,
  warning: Warning,
});
export type IdentityEdge = z.infer<typeof IdentityEdge>;

export const IdentityGraph = z.object({
  nodes: z.array(IdentityNode).max(5000),
  edges: z.array(IdentityEdge).max(20000),
});
export type IdentityGraph = z.infer<typeof IdentityGraph>;

export const Provider = z.enum(["azure", "aws", "gcp", "kubernetes", "generic"]);
export type Provider = z.infer<typeof Provider>;

const DocLink = z.object({ title: z.string(), url: z.url() });

export const Pattern = z.object({
  id: Id,
  /** "warning" marks an anti-pattern: what not to do, and why. */
  type: z.enum(["pattern", "warning"]).default("pattern"),
  provider: Provider,
  title: z.string().min(1),
  summary: z.string(),
  notes: z.array(z.string()).default([]),
  docs: z.array(DocLink).default([]),
  /** For a warning: id of the pattern that shows the safe version. */
  fixedBy: Id.optional(),
  graph: IdentityGraph,
});
export type Pattern = z.infer<typeof Pattern>;

/** Several patterns side by side, plus a table comparing them along named dimensions. */
export const Comparison = z
  .object({
    id: Id,
    title: z.string().min(1),
    /** Sidebar group, e.g. "Kubernetes" or "CI/CD". */
    topic: z.string().min(1).max(60).default("General"),
    summary: z.string(),
    patterns: z.array(Id).min(2).max(4),
    /** Each row has one value per pattern, in the same order as `patterns`. */
    dimensions: z.array(z.object({ label: z.string().min(1), values: z.array(z.string()) })),
    notes: z.array(z.string()).default([]),
  })
  .refine((c) => c.dimensions.every((d) => d.values.length === c.patterns.length), {
    message: "every dimension needs exactly one value per pattern",
    path: ["dimensions"],
  });
export type Comparison = z.infer<typeof Comparison>;
