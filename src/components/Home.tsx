import { providerLabels } from "../domain/catalog";
import type { View } from "../domain/routing";
import type { Comparison, Pattern, Provider } from "../domain/schema";
import { edgeVisuals, WARNING_COLOR } from "../domain/visuals";
import { SectionIcon, topicIcon } from "./SectionIcon";

type Props = {
  patterns: Pattern[];
  comparisons: Comparison[];
  onNavigate: (view: View) => void;
};

const REPO_URL = "https://github.com/anttus/cloud-identity-patterns";
const providerOrder: Provider[] = ["kubernetes", "azure", "aws", "gcp", "generic"];
/** How many pattern links each platform card lists before "… and N more". */
const PER_PLATFORM = 4;

/** The few line styles a first-time reader needs; the full legend lives in each diagram's panel. */
const legend = [
  {
    label: "Trust (federation)",
    color: edgeVisuals.federatesWith.color,
    dashed: edgeVisuals.federatesWith.dashed,
  },
  { label: "Authenticates as", color: edgeVisuals.runsAs.color, dashed: edgeVisuals.runsAs.dashed },
  {
    label: "Permission granted",
    color: edgeVisuals.hasRoleAssignment.color,
    dashed: edgeVisuals.hasRoleAssignment.dashed,
  },
  { label: "Risk in an anti-pattern", color: WARNING_COLOR, dashed: false },
];

const Line = ({ color, dashed }: { color: string; dashed?: boolean }) => (
  <svg width="28" height="10" aria-hidden="true">
    <line
      x1="1"
      y1="5"
      x2="27"
      y2="5"
      stroke={color}
      strokeWidth="2.5"
      strokeDasharray={dashed ? "5 3" : undefined}
    />
  </svg>
);

export const Home = ({ patterns, comparisons, onNavigate }: Props) => {
  const good = patterns.filter((p) => p.type === "pattern");
  const warnings = patterns.filter((p) => p.type === "warning");
  const platforms = providerOrder
    .map((provider) => ({ provider, items: good.filter((p) => p.provider === provider) }))
    .filter((g) => g.items.length > 0);
  const openPattern = (id: string) => onNavigate({ type: "pattern", id });
  // Same order as the sidebar: Kubernetes comparisons first, then the other topics.
  const orderedComparisons = [...comparisons].sort((x, y) =>
    x.topic === y.topic
      ? 0
      : x.topic === "Kubernetes"
        ? -1
        : y.topic === "Kubernetes"
          ? 1
          : x.topic.localeCompare(y.topic),
  );

  return (
    <div className="home">
      <header className="home-hero">
        <img className="home-logo" src="/favicon.svg" alt="" width="72" height="72" />
        <div>
          <h2 className="home-title">Cloud Identity Patterns</h2>
          <p className="home-tagline">
            See how identities, trust and permissions connect across Azure, AWS, Google Cloud and
            Kubernetes, and how each cloud solves the same problem differently.
          </p>
          <ul className="home-stats" aria-label="Catalog size">
            <li>
              <strong>{good.length}</strong> patterns
            </li>
            <li>
              <strong>{comparisons.length}</strong> comparisons
            </li>
            <li>
              <strong>{warnings.length}</strong> anti-patterns
            </li>
          </ul>
        </div>
      </header>

      <section aria-labelledby="home-compare">
        <h3 id="home-compare">Start with a comparison</h3>
        <p className="summary">
          The same idea side by side, with a table of how each platform differs.
        </p>
        <div className="home-grid">
          {orderedComparisons.map((c) => (
            <button
              key={c.id}
              type="button"
              className="home-card"
              onClick={() => onNavigate({ type: "comparison", id: c.id })}
            >
              <span className="home-card-kicker">
                <SectionIcon name={topicIcon(c.topic)} />
                {c.topic}
              </span>
              <span className="home-card-title">{c.title}</span>
              <span className="home-card-text">{c.summary}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-platforms">
        <h3 id="home-platforms">Browse by platform</h3>
        <div className="home-grid">
          {platforms.map(({ provider, items }) => (
            <div key={provider} className="home-card static">
              <span className="home-card-kicker">
                <SectionIcon name={provider} />
                {providerLabels[provider]} · {items.length}
              </span>
              <ul className="home-links">
                {items.slice(0, PER_PLATFORM).map((p) => (
                  <li key={p.id}>
                    <button type="button" className="link-button" onClick={() => openPattern(p.id)}>
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
              {items.length > PER_PLATFORM && (
                <span className="home-card-text">
                  … and {items.length - PER_PLATFORM} more in the sidebar
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-warnings">
        <h3 id="home-warnings" className="warning-heading">
          <SectionIcon name="warning" />
          Learn from anti-patterns
        </h3>
        <p className="summary">
          Common mistakes, with the risky parts marked in red and a link to the safe version.
        </p>
        <ul className="home-warning-list">
          {warnings.map((p) => (
            <li key={p.id}>
              <button type="button" className="link-button" onClick={() => openPattern(p.id)}>
                {p.title}
              </button>{" "}
              <span className="badge">{providerLabels[p.provider]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-read">
        <h3 id="home-read">How to read the diagrams</h3>
        <ul className="home-read">
          <li>
            Each box is an identity, a trust setting or a resource. Its coloured label says which.
          </li>
          <li>
            Arrows run from where trust starts, at the top, to what it reaches, at the bottom.
          </li>
          <li>Click any box or arrow to see what it is and why it matters.</li>
        </ul>
        <ul className="legend home-legend">
          {legend.map((l) => (
            <li key={l.label}>
              <Line color={l.color} dashed={l.dashed} />
              {l.label}
            </li>
          ))}
        </ul>
      </section>

      <footer className="home-footer">
        <a className="home-footer-link" href={REPO_URL} target="_blank" rel="noreferrer noopener">
          Source on GitHub
        </a>
        <span>MIT License</span>
        <span>Not affiliated with Microsoft, Amazon, Google or the CNCF.</span>
      </footer>
    </div>
  );
};
