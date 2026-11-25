import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { catalog } from "./catalog";
import { ComparisonView } from "./components/ComparisonView";
import { ComparisonPanel, PatternPanel } from "./components/DetailsPanel";
import { GraphView, type Selection } from "./components/GraphView";
import { PanelToggle } from "./components/PanelToggle";
import { ResizeHandle } from "./components/ResizeHandle";
import { Sidebar } from "./components/Sidebar";
import { parseHash, type View, viewToHash } from "./domain/routing";
import type { Pattern } from "./domain/schema";
import { usePersistentFlag, usePersistentNumber } from "./usePersistentFlag";

const { patterns, comparisons } = catalog;
const findPattern = (id?: string) => patterns.find((p) => p.id === id);

const defaultView = (): View | null => {
  const first = comparisons[0] ?? patterns[0];
  if (!first) return null;
  return comparisons[0] ? { type: "comparison", id: first.id } : { type: "pattern", id: first.id };
};

/** Panel width limits in px. The canvas always keeps at least MIN_CANVAS. */
const NAV = { initial: 240, min: 180, max: 480 };
const DETAILS = { initial: 340, min: 260, max: 640 };
const MIN_CANVAS = 320;

/** Upper bound for one panel, leaving room for the other panel and the canvas. */
const maxWidth = (limit: number, min: number, other: number) =>
  Math.max(min, Math.min(limit, window.innerWidth - other - MIN_CANVAS));

const currentView = () => parseHash(window.location.hash, catalog) ?? defaultView();

export const App = () => {
  // The URL hash is the source of truth, so links, bookmarks and back/forward all work.
  const [view, setView] = useState<View | null>(currentView);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [navOpen, setNavOpen] = usePersistentFlag("panel.nav", true);
  const [detailsOpen, setDetailsOpen] = usePersistentFlag("panel.details", true);
  const [navWidth, setNavWidth, saveNavWidth] = usePersistentNumber("panel.nav.width", NAV.initial);
  const [detailsWidth, setDetailsWidth, saveDetailsWidth] = usePersistentNumber(
    "panel.details.width",
    DETAILS.initial,
  );
  // Bumped when a resize ends, so diagrams re-fit once instead of on every drag frame.
  const [fitCount, setFitCount] = useState(0);

  useEffect(() => {
    const onHashChange = () => {
      setView(currentView());
      setSelection(null);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: View) => {
    window.location.hash = viewToHash(next);
  };

  // Changing the canvas width should re-fit the diagrams, so it's part of their key.
  const sizeKey = `${navOpen}-${detailsOpen}-${fitCount}`;
  const commitWidth = (save: (w: number) => void) => (w: number) => {
    save(w);
    setFitCount((n) => n + 1);
  };

  const resolve = (): { content: ReactNode; panel: ReactNode } | null => {
    if (view?.type === "pattern") {
      const pattern = findPattern(view.id);
      if (!pattern) return null;
      return {
        content: (
          <GraphView
            key={`${pattern.id}-${sizeKey}`}
            graph={pattern.graph}
            onSelect={setSelection}
          />
        ),
        panel: (
          <PatternPanel
            pattern={pattern}
            fix={findPattern(pattern.fixedBy)}
            selection={selection}
            onNavigate={navigate}
          />
        ),
      };
    }
    if (view?.type === "comparison") {
      const comparison = comparisons.find((c) => c.id === view.id);
      if (!comparison) return null;
      const columns = comparison.patterns
        .map(findPattern)
        .filter((p): p is Pattern => p !== undefined);
      return {
        content: (
          <ComparisonView
            key={`${comparison.id}-${sizeKey}`}
            comparison={comparison}
            patterns={columns}
            onSelect={setSelection}
            onNavigate={navigate}
          />
        ),
        panel: <ComparisonPanel comparison={comparison} patterns={columns} selection={selection} />,
      };
    }
    return null;
  };

  const resolved = resolve();
  const layoutClasses = [
    "layout",
    !navOpen && "nav-collapsed",
    !detailsOpen && "details-collapsed",
  ];

  return (
    <div
      className={layoutClasses.filter(Boolean).join(" ")}
      style={{ "--nav-w": `${navWidth}px`, "--details-w": `${detailsWidth}px` } as CSSProperties}
    >
      <Sidebar patterns={patterns} comparisons={comparisons} view={view} onNavigate={navigate} />
      <main className={resolved ? "canvas" : "canvas empty"}>
        {navOpen && (
          <ResizeHandle
            side="left"
            width={navWidth}
            min={NAV.min}
            max={maxWidth(NAV.max, NAV.min, detailsOpen ? detailsWidth : 0)}
            defaultWidth={NAV.initial}
            controls="nav-panel"
            label="pattern list"
            onResize={setNavWidth}
            onCommit={commitWidth(saveNavWidth)}
          />
        )}
        {resolved?.panel && detailsOpen && (
          <ResizeHandle
            side="right"
            width={detailsWidth}
            min={DETAILS.min}
            max={maxWidth(DETAILS.max, DETAILS.min, navOpen ? navWidth : 0)}
            defaultWidth={DETAILS.initial}
            controls="details-panel"
            label="details"
            onResize={setDetailsWidth}
            onCommit={commitWidth(saveDetailsWidth)}
          />
        )}
        <PanelToggle
          side="left"
          open={navOpen}
          label="pattern list"
          controls="nav-panel"
          onToggle={() => setNavOpen(!navOpen)}
        />
        {resolved?.panel && (
          <PanelToggle
            side="right"
            open={detailsOpen}
            label="details"
            controls="details-panel"
            onToggle={() => setDetailsOpen(!detailsOpen)}
          />
        )}
        {resolved?.content ?? "Nothing to show."}
      </main>
      {resolved?.panel}
    </div>
  );
};
