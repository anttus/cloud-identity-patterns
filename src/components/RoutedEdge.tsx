import { BaseEdge, type Edge, type EdgeProps } from "@xyflow/react";
import type { Point } from "../domain/layout";

export type RoutedFlowEdge = Edge<{ points: Point[]; labelAt?: Point }, "routed">;

/** Draws the polyline ELK computed; falls back to a straight line if no route exists. */
export const RoutedEdge = (props: EdgeProps<RoutedFlowEdge>) => {
  const routed = props.data?.points ?? [];
  const points: Point[] =
    routed.length >= 2
      ? routed
      : [
          { x: props.sourceX, y: props.sourceY },
          { x: props.targetX, y: props.targetY },
        ];
  const path = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  // Prefer ELK's label position (collision-free). Fallback: middle of the middle segment.
  const mid = Math.floor((points.length - 1) / 2);
  const a = points[mid] as Point;
  const b = points[mid + 1] as Point;
  const labelAt = props.data?.labelAt ?? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

  return (
    <BaseEdge
      id={props.id}
      path={path}
      markerEnd={props.markerEnd}
      style={props.style}
      label={props.label}
      labelX={labelAt.x}
      labelY={labelAt.y}
      labelStyle={props.labelStyle}
      labelShowBg={props.labelShowBg}
      labelBgStyle={props.labelBgStyle}
      labelBgPadding={props.labelBgPadding}
      labelBgBorderRadius={props.labelBgBorderRadius}
      interactionWidth={props.interactionWidth}
    />
  );
};
