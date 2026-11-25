import { providerLabels } from "../domain/catalog";
import type { View } from "../domain/routing";
import type { Comparison, Pattern } from "../domain/schema";
import { GraphView, type Selection } from "./GraphView";

type Props = {
  comparison: Comparison;
  patterns: Pattern[];
  onSelect: (selection: Selection | null) => void;
  onNavigate: (view: View) => void;
};

/** Patterns as side-by-side columns, with a dimension-by-pattern table underneath. */
export const ComparisonView = ({ comparison, patterns, onSelect, onNavigate }: Props) => (
  <div className="compare" style={{ "--cols": patterns.length } as React.CSSProperties}>
    <div className="compare-graphs">
      {patterns.map((p) => (
        <section key={p.id} className="compare-col">
          <header>
            <span className="eyebrow">{providerLabels[p.provider]}</span>
            <button
              type="button"
              className="link-button"
              onClick={() => onNavigate({ type: "pattern", id: p.id })}
            >
              {p.title}
            </button>
          </header>
          <div className="compare-canvas">
            <GraphView key={p.id} graph={p.graph} onSelect={onSelect} />
          </div>
        </section>
      ))}
    </div>
    <div className="compare-table-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th scope="col" />
            {patterns.map((p) => (
              <th key={p.id} scope="col">
                {providerLabels[p.provider]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.dimensions.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              {d.values.map((v, i) => (
                <td key={patterns[i]?.id ?? i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
