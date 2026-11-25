import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge } from "elkjs/lib/elk-api";
import { placeLabels } from "./labels";
import type { IdentityGraph } from "./schema";
import { EDGE_LABEL_FONT_SIZE, edgeLabelText } from "./visuals";

const elk = new ELK();

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

/** Drawn label box: text plus the background padding set in GraphView (6px × 3px). */
const LABEL_PAD_X = 12;
const LABEL_HEIGHT = Math.ceil(EDGE_LABEL_FONT_SIZE * 1.3) + 6;

export type Point = { x: number; y: number };
export type Layout = {
  positions: Record<string, Point>;
  /** Orthogonal edge routes from ELK, so long edges go around nodes instead of through them. */
  routes: Record<string, Point[]>;
  /** Centre of each edge label: on its own line, clear of nodes and other labels. */
  labels: Record<string, Point>;
};

/** Trust flows along `direction`. "down" is the default: diagrams read top to bottom. */
export type Direction = "right" | "down";

let ctx: CanvasRenderingContext2D | null | undefined;
/** Real text width in the browser; a per-character estimate elsewhere (tests, SSR). */
const textWidth = (text: string): number => {
  if (ctx === undefined) {
    try {
      ctx =
        typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
      if (ctx)
        ctx.font = `${EDGE_LABEL_FONT_SIZE}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    } catch {
      ctx = null;
    }
  }
  return ctx ? ctx.measureText(text).width : text.length * EDGE_LABEL_FONT_SIZE * 0.6;
};

/** Layered layout: sources of trust first, resources last. */
export const layoutGraph = async (
  graph: IdentityGraph,
  direction: Direction = "down",
): Promise<Layout> => {
  const result = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction === "right" ? "RIGHT" : "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      // Vertical layouts need less room between layers: nodes are wider than tall.
      "elk.layered.spacing.nodeNodeBetweenLayers": direction === "right" ? "140" : "70",
      "elk.spacing.nodeNode": "60",
      "elk.spacing.edgeNode": "30",
    },
    children: graph.nodes.map((n) => ({ id: n.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: graph.edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  });

  const positions: Record<string, Point> = Object.fromEntries(
    (result.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
  );
  const routes: Record<string, Point[]> = Object.fromEntries(
    ((result.edges ?? []) as ElkExtendedEdge[]).map((e) => [
      e.id,
      (e.sections ?? []).flatMap((s) => [s.startPoint, ...(s.bendPoints ?? []), s.endPoint]),
    ]),
  );

  const nodeBoxes = Object.values(positions).map((p) => ({
    ...p,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));
  const requests = graph.edges.flatMap((e) => {
    const text = edgeLabelText(e);
    return text ? [{ id: e.id, width: textWidth(text) + LABEL_PAD_X, height: LABEL_HEIGHT }] : [];
  });
  const labels = placeLabels(requests, routes, nodeBoxes);

  return { positions, routes, labels };
};
