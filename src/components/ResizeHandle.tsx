import { type KeyboardEvent, type PointerEvent, useRef } from "react";

type Props = {
  /** Which panel this handle resizes; its handle sits on that panel's inner edge. */
  side: "left" | "right";
  width: number;
  min: number;
  max: number;
  defaultWidth: number;
  /** id of the panel element, for aria-controls. */
  controls: string;
  label: string;
  /** Live updates while dragging. */
  onResize: (width: number) => void;
  /** Final width: drag end, keyboard step or reset. */
  onCommit: (width: number) => void;
};

const KEY_STEP = 16;

/**
 * Drag handle on the edge between a side panel and the canvas. Pointer capture keeps the
 * drag going even when the cursor crosses the diagram; arrow keys and double-click
 * (reset) make it usable without a mouse.
 */
export const ResizeHandle = ({
  side,
  width,
  min,
  max,
  defaultWidth,
  controls,
  label,
  onResize,
  onCommit,
}: Props) => {
  const drag = useRef<{ startX: number; startWidth: number; last: number } | null>(null);
  const clamp = (w: number) => Math.min(max, Math.max(min, Math.round(w)));
  // Dragging toward the canvas widens the panel: right for the left panel, left for the right one.
  const direction = side === "left" ? 1 : -1;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startWidth: width, last: width };
    document.body.classList.add("resizing");
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = clamp(d.startWidth + (e.clientX - d.startX) * direction);
    if (next !== d.last) {
      d.last = next;
      onResize(next);
    }
  };

  const end = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    document.body.classList.remove("resizing");
    if (d.last !== d.startWidth) onCommit(d.last);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP };
    const step = steps[e.key];
    if (step !== undefined) {
      e.preventDefault();
      onCommit(clamp(width + step * direction));
    } else if (e.key === "Home") {
      e.preventDefault();
      onCommit(defaultWidth);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable separator is the ARIA pattern for splitters; <hr> can't take focus or keyboard input.
    <div
      className={`resize-handle ${side}`}
      role="separator"
      aria-orientation="vertical"
      aria-controls={controls}
      aria-label={`Resize ${label}`}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      title={`Drag to resize ${label}. Double-click to reset.`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={() => onCommit(defaultWidth)}
      onKeyDown={onKeyDown}
    />
  );
};
