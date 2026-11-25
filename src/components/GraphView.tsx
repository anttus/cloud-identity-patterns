import { Background, Controls, MarkerType, ReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
  type Direction,
  type Layout,
  layoutGraph,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "../domain/layout";
import type { IdentityEdge, IdentityGraph, IdentityNode } from "../domain/schema";
import { EDGE_LABEL_FONT_SIZE, edgeLabelText, edgeVisuals, WARNING_COLOR } from "../domain/visuals";
import { type IdentityFlowNode, IdentityNodeView } from "./IdentityNodeView";
import { RoutedEdge, type RoutedFlowEdge } from "./RoutedEdge";

/** What was clicked, plus the graph it belongs to (comparisons show several graphs). */
export type Selection = (
  | { type: "node"; node: IdentityNode }
  | { type: "edge"; edge: IdentityEdge }
) & {
  graph: IdentityGraph;
};

type Props = {
  graph: IdentityGraph;
  onSelect: (selection: Selection | null) => void;
  direction?: Direction;
};

const nodeTypes = { identity: IdentityNodeView };
const edgeTypes = { routed: RoutedEdge };

const toFlowEdge = (e: IdentityEdge, layout: Layout): RoutedFlowEdge => {
  const v = edgeVisuals[e.kind];
  const color = e.warning ? WARNING_COLOR : v.color;
  return {
    id: e.id,
    type: "routed",
    source: e.source,
    target: e.target,
    data: { points: layout.routes[e.id] ?? [], labelAt: layout.labels[e.id] },
    label: edgeLabelText(e),
    animated: v.animated,
    style: {
      stroke: color,
      strokeWidth: e.warning ? 3 : 2,
      strokeDasharray: v.dashed ? "6 4" : undefined,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "var(--bg-elevated)" },
    labelStyle: { fill: "var(--fg)", fontSize: EDGE_LABEL_FONT_SIZE },
  };
};

/** Callers should pass `key={graphId}` so switching graphs remounts and re-fits the view. */
export const GraphView = ({ graph, onSelect, direction = "down" }: Props) => {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    let cancelled = false;
    layoutGraph(graph, direction).then((l) => {
      if (!cancelled) setLayout(l);
    });
    return () => {
      cancelled = true;
    };
  }, [graph, direction]);

  const nodes = useMemo<IdentityFlowNode[]>(
    () =>
      layout
        ? graph.nodes.map((n) => ({
            id: n.id,
            type: "identity",
            position: layout.positions[n.id] ?? { x: 0, y: 0 },
            // Same size ELK used, so fitView is correct before DOM measurement.
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            data: { identity: n, direction },
          }))
        : [],
    [graph, layout, direction],
  );
  const edges = useMemo(
    () => (layout ? graph.edges.map((e) => toFlowEdge(e, layout)) : []),
    [graph, layout],
  );

  // Render only once laid out, so the initial fitView sees final positions.
  if (!layout) return null;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: "48px" }}
      minZoom={0.2}
      // MIT-licensed; hiding the attribution is allowed. React Flow asks commercial users to consider sponsoring.
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesReconnectable={false}
      onNodeClick={(_, n) => {
        const node = graph.nodes.find((x) => x.id === n.id);
        onSelect(node ? { type: "node", node, graph } : null);
      }}
      onEdgeClick={(_, e) => {
        const edge = graph.edges.find((x) => x.id === e.id);
        onSelect(edge ? { type: "edge", edge, graph } : null);
      }}
      onPaneClick={() => onSelect(null)}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
};
