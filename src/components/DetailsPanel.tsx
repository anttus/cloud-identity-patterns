import { providerLabels } from "../domain/catalog";
import type { View } from "../domain/routing";
import type { Comparison, IdentityGraph, Pattern } from "../domain/schema";
import { edgeVisuals, nodeVisuals, WARNING_COLOR } from "../domain/visuals";
import type { Selection } from "./GraphView";

const Properties = ({ properties }: { properties?: Record<string, string> }) =>
  properties && Object.keys(properties).length ? (
    <dl className="props">
      {Object.entries(properties).map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>
            <code>{v}</code>
          </dd>
        </div>
      ))}
    </dl>
  ) : null;

const WarningCallout = ({ text }: { text?: string }) =>
  text ? (
    <p className="callout warning" role="note">
      <strong>⚠ Risk:</strong> {text}
    </p>
  ) : null;

const SelectionDetails = ({ selection }: { selection: Selection }) => {
  if (selection.type === "node") {
    const { node } = selection;
    return (
      <section className="card">
        <div className="eyebrow">{nodeVisuals[node.kind].label}</div>
        <h3>{node.label}</h3>
        <WarningCallout text={node.warning} />
        {node.description && <p>{node.description}</p>}
        <Properties properties={node.properties} />
      </section>
    );
  }
  const { edge, graph } = selection;
  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  return (
    <section className="card">
      <div className="eyebrow">{edgeVisuals[edge.kind].label}</div>
      <h3>
        {label(edge.source)} → {label(edge.target)}
      </h3>
      <WarningCallout text={edge.warning} />
      {edge.label && <p>{edge.label}</p>}
      <Properties properties={edge.properties} />
    </section>
  );
};

const LegendLine = ({ color, dashed }: { color: string; dashed?: boolean }) => (
  <svg width="32" height="8" aria-hidden="true">
    <line
      x1="0"
      y1="4"
      x2="32"
      y2="4"
      stroke={color}
      strokeWidth="2"
      strokeDasharray={dashed ? "6 4" : undefined}
    />
  </svg>
);

const Legend = ({ graphs }: { graphs: IdentityGraph[] }) => {
  const edges = graphs.flatMap((g) => g.edges);
  const kinds = [...new Set(edges.map((e) => e.kind))];
  const hasWarnings = graphs.some((g) => [...g.nodes, ...g.edges].some((x) => x.warning));
  return (
    <section>
      <h4>Legend</h4>
      <ul className="legend">
        {kinds.map((k) => (
          <li key={k}>
            <LegendLine color={edgeVisuals[k].color} dashed={edgeVisuals[k].dashed} />
            {edgeVisuals[k].label}
          </li>
        ))}
        {hasWarnings && (
          <li>
            <LegendLine color={WARNING_COLOR} />
            Risky element
          </li>
        )}
      </ul>
    </section>
  );
};

const Notes = ({ notes }: { notes: string[] }) =>
  notes.length ? (
    <section>
      <h4>Key points</h4>
      <ul className="notes">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </section>
  ) : null;

const SelectionOrHint = ({ selection }: { selection: Selection | null }) =>
  selection ? (
    <SelectionDetails selection={selection} />
  ) : (
    <p className="hint">Click a node or edge to inspect it.</p>
  );

type PatternPanelProps = {
  pattern: Pattern;
  fix?: Pattern;
  selection: Selection | null;
  onNavigate: (view: View) => void;
};

export const PatternPanel = ({ pattern, fix, selection, onNavigate }: PatternPanelProps) => (
  <aside id="details-panel" className="details" aria-label="Details">
    <div className="eyebrow">{providerLabels[pattern.provider]}</div>
    {pattern.type === "warning" && (
      <div className="banner warning" role="note">
        ⚠ Anti-pattern: this is what <em>not</em> to do.
      </div>
    )}
    <h2>{pattern.title}</h2>
    <p className="summary">{pattern.summary}</p>
    {fix && (
      <button
        type="button"
        className="link-button"
        onClick={() => onNavigate({ type: "pattern", id: fix.id })}
      >
        See the safe version: {fix.title} →
      </button>
    )}
    <SelectionOrHint selection={selection} />
    <Notes notes={pattern.notes} />
    <Legend graphs={[pattern.graph]} />
    {pattern.docs.length > 0 && (
      <section>
        <h4>References</h4>
        <ul className="docs">
          {pattern.docs.map((d) => (
            <li key={d.url}>
              <a href={d.url} target="_blank" rel="noreferrer noopener">
                {d.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
  </aside>
);

type ComparisonPanelProps = {
  comparison: Comparison;
  patterns: Pattern[];
  selection: Selection | null;
};

export const ComparisonPanel = ({ comparison, patterns, selection }: ComparisonPanelProps) => (
  <aside id="details-panel" className="details" aria-label="Details">
    <div className="eyebrow">Comparison</div>
    <h2>{comparison.title}</h2>
    <p className="summary">{comparison.summary}</p>
    <SelectionOrHint selection={selection} />
    <Notes notes={comparison.notes} />
    <Legend graphs={patterns.map((p) => p.graph)} />
  </aside>
);
