import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import type { Direction } from "../domain/layout";
import type { IdentityNode } from "../domain/schema";
import { nodeVisuals } from "../domain/visuals";

export type IdentityFlowNode = Node<{ identity: IdentityNode; direction: Direction }, "identity">;

export const IdentityNodeView = ({ data, selected }: NodeProps<IdentityFlowNode>) => {
  const visual = nodeVisuals[data.identity.kind];
  // Invisible anchors: React Flow needs handles to attach edges, but the graph is read-only.
  const [inSide, outSide] =
    data.direction === "down" ? [Position.Top, Position.Bottom] : [Position.Left, Position.Right];
  const warned = Boolean(data.identity.warning);
  const classes = ["id-node", selected && "selected", warned && "warning"].filter(Boolean);
  return (
    <div className={classes.join(" ")} style={{ borderLeftColor: visual.color }}>
      <Handle type="target" position={inSide} isConnectable={false} className="id-handle" />
      <div className="id-node-kind" style={{ color: visual.color }}>
        {warned && <span className="warn-icon">⚠ </span>}
        {visual.label}
      </div>
      <div className="id-node-label">{data.identity.label}</div>
      <Handle type="source" position={outSide} isConnectable={false} className="id-handle" />
    </div>
  );
};
