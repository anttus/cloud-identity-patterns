import { providerLabels } from "../domain/catalog";
import type { View } from "../domain/routing";
import type { Comparison, Pattern, Provider } from "../domain/schema";
import { SectionIcon, topicIcon } from "./SectionIcon";

const providerOrder: Provider[] = ["azure", "aws", "gcp", "kubernetes", "generic"];

type Props = {
  patterns: Pattern[];
  comparisons: Comparison[];
  view: View | null;
  onNavigate: (view: View) => void;
};

const Item = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <li>
    <button type="button" className={active ? "active" : undefined} onClick={onClick}>
      {children}
    </button>
  </li>
);

export const Sidebar = ({ patterns, comparisons, view, onNavigate }: Props) => {
  const isActive = (type: View["type"], id: string) => view?.type === type && view.id === id;
  const good = patterns.filter((p) => p.type === "pattern");
  const warnings = patterns.filter((p) => p.type === "warning");
  // Kubernetes first: it's the main comparison area; the rest alphabetically.
  const topics = [...new Set(comparisons.map((c) => c.topic))].sort((a, b) =>
    a === "Kubernetes" ? -1 : b === "Kubernetes" ? 1 : a.localeCompare(b),
  );

  return (
    <nav id="nav-panel" className="sidebar" aria-label="Patterns">
      <h1 className="app-title">
        <img src="/favicon.svg" alt="" width="24" height="24" />
        Cloud Identity Patterns
      </h1>

      <section className="nav-group" aria-labelledby="nav-compare">
        <h2 id="nav-compare">Comparisons</h2>
        {topics.map((topic) => (
          <section key={topic}>
            <h4>
              <SectionIcon name={topicIcon(topic)} />
              {topic}
            </h4>
            <ul>
              {comparisons
                .filter((c) => c.topic === topic)
                .map((c) => (
                  <Item
                    key={c.id}
                    active={isActive("comparison", c.id)}
                    onClick={() => onNavigate({ type: "comparison", id: c.id })}
                  >
                    {c.title}
                  </Item>
                ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="nav-group" aria-labelledby="nav-patterns">
        <h2 id="nav-patterns">Patterns</h2>
        {providerOrder.map((provider) => {
          const items = good.filter((p) => p.provider === provider);
          if (!items.length) return null;
          return (
            <section key={provider}>
              <h4>
                <SectionIcon name={provider} />
                {providerLabels[provider]}
              </h4>
              <ul>
                {items.map((p) => (
                  <Item
                    key={p.id}
                    active={isActive("pattern", p.id)}
                    onClick={() => onNavigate({ type: "pattern", id: p.id })}
                  >
                    {p.title}
                  </Item>
                ))}
              </ul>
            </section>
          );
        })}
      </section>

      <section className="nav-group" aria-labelledby="nav-warnings">
        <h2 id="nav-warnings" className="warning-heading">
          <SectionIcon name="warning" />
          Anti-patterns
        </h2>
        <ul>
          {warnings.map((p) => (
            <Item
              key={p.id}
              active={isActive("pattern", p.id)}
              onClick={() => onNavigate({ type: "pattern", id: p.id })}
            >
              {p.title} <span className="badge">{providerLabels[p.provider]}</span>
            </Item>
          ))}
        </ul>
      </section>
    </nav>
  );
};
