import { type ReactNode, useEffect, useState } from "react";
import { catalog } from "./catalog";
import { ComparisonView } from "./components/ComparisonView";
import { ComparisonPanel, PatternPanel } from "./components/DetailsPanel";
import { GraphView, type Selection } from "./components/GraphView";
import { PanelToggle } from "./components/PanelToggle";
import { Sidebar } from "./components/Sidebar";
import { parseHash, type View, viewToHash } from "./domain/routing";
import type { Pattern } from "./domain/schema";
import { usePersistentFlag } from "./usePersistentFlag";

const { patterns, comparisons } = catalog;
const findPattern = (id?: string) => patterns.find((p) => p.id === id);

const defaultView = (): View | null => {
  const first = comparisons[0] ?? patterns[0];
  if (!first) return null;
  return comparisons[0] ? { type: "comparison", id: first.id } : { type: "pattern", id: first.id };
};

const currentView = () => parseHash(window.location.hash, catalog) ?? defaultView();

export const App = () => {
  // The URL hash is the source of truth, so links, bookmarks and back/forward all work.
  const [view, setView] = useState<View | null>(currentView);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [navOpen, setNavOpen] = usePersistentFlag("panel.nav", true);
  const [detailsOpen, setDetailsOpen] = usePersistentFlag("panel.details", true);

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
  const sizeKey = `${navOpen}-${detailsOpen}`;

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
    <div className={layoutClasses.filter(Boolean).join(" ")}>
      <Sidebar patterns={patterns} comparisons={comparisons} view={view} onNavigate={navigate} />
      <main className={resolved ? "canvas" : "canvas empty"}>
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
