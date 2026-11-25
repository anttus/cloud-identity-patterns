import type { EdgeKind, NodeKind } from "./schema";

/** Presentation metadata per kind. Colours are CSS variables defined in styles.css. */

export const nodeVisuals: Record<NodeKind, { label: string; color: string }> = {
  user: { label: "User", color: "var(--c-principal)" },
  group: { label: "Group", color: "var(--c-principal)" },
  appRegistration: { label: "App registration", color: "var(--c-app)" },
  servicePrincipal: { label: "Service principal", color: "var(--c-app)" },
  userAssignedIdentity: { label: "User-assigned MI", color: "var(--c-identity)" },
  systemAssignedIdentity: { label: "System-assigned MI", color: "var(--c-identity)" },
  iamRole: { label: "IAM role", color: "var(--c-identity)" },
  serviceAccount: { label: "Service account", color: "var(--c-identity)" },
  externalIssuer: { label: "External OIDC issuer", color: "var(--c-external)" },
  identityProvider: { label: "Identity provider", color: "var(--c-external)" },
  k8sServiceAccount: { label: "K8s service account", color: "var(--c-workload)" },
  roleBinding: { label: "Role binding", color: "var(--c-grant)" },
  roleDefinition: { label: "Role definition", color: "var(--c-grant)" },
  federatedCredential: { label: "Federated credential", color: "var(--c-external)" },
  credential: { label: "Stored credential", color: "var(--c-warning)" },
  workload: { label: "Workload", color: "var(--c-workload)" },
  scope: { label: "Scope", color: "var(--c-scope)" },
};

export type EdgeVisual = { label: string; color: string; dashed?: boolean; animated?: boolean };

export const edgeVisuals: Record<EdgeKind, EdgeVisual> = {
  federatesWith: { label: "Federation trust", color: "var(--c-external)", animated: true },
  hasRoleAssignment: { label: "Permission grant (active)", color: "var(--c-grant)" },
  isEligibleFor: { label: "PIM eligible", color: "var(--c-eligible)", dashed: true },
  canAssume: { label: "Can assume / impersonate", color: "var(--c-identity)", animated: true },
  memberOf: { label: "Member of", color: "var(--c-muted)" },
  owns: { label: "Owns", color: "var(--c-muted)" },
  attachedTo: { label: "Attached to", color: "var(--c-identity)" },
  runsAs: { label: "Authenticates as", color: "var(--c-workload)" },
  uses: { label: "Uses / reads", color: "var(--c-muted)" },
  subjectOf: { label: "Subject of binding", color: "var(--c-workload)" },
  grants: { label: "Binding grants role", color: "var(--c-grant)" },
  scopedTo: { label: "Limited to scope", color: "var(--c-scope)", dashed: true },
  childOf: { label: "Contained in / inherits from", color: "var(--c-muted)", dashed: true },
  instanceOf: { label: "Instance of", color: "var(--c-app)" },
};

export const WARNING_COLOR = "var(--c-warning)";

/** The text drawn on an edge. Layout sizes exactly this string, so keep them in one place. */
export const edgeLabelText = (e: {
  kind: EdgeKind;
  label?: string;
  warning?: string;
}): string | undefined => (e.warning ? `⚠ ${e.label ?? edgeVisuals[e.kind].label}` : e.label);

export const EDGE_LABEL_FONT_SIZE = 10;
