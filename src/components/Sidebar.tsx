import { useEffect, useRef, useState } from "react";
import {
  BASICS_TOPIC,
  basicsFirst,
  compareTopics,
  comparisonSearchText,
  matchesQuery,
  patternSearchText,
  providerLabels,
} from "../domain/catalog";
import { HOME_HASH, type View } from "../domain/routing";
import type { Comparison, Pattern, Provider } from "../domain/schema";
import { SectionIcon, topicIcon } from "./SectionIcon";

const providerOrder: Provider[] = ["azure", "aws", "gcp", "kubernetes", "generic"];

type Props = {
  patterns: Pattern[];
  comparisons: Comparison[];
  view: View;
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

export const Sidebar = ({
  patterns: allPatterns,
  comparisons: allComparisons,
  view,
  onNavigate,
}: Props) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtering = query.trim() !== "";
  const patterns = allPatterns.filter((p) => matchesQuery(patternSearchText(p), query));
  const comparisons = allComparisons.filter((c) => matchesQuery(comparisonSearchText(c), query));
  const resultCount = patterns.length + comparisons.length;

  // "/" focuses the search from anywhere, unless the user is already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable='true']"))
        return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (type: "pattern" | "comparison", id: string) =>
    view.type === type && view.id === id;
  const good = patterns.filter((p) => p.type === "pattern");
  const warnings = patterns.filter((p) => p.type === "warning");
  // Basics get their own group: overview patterns per platform plus the Basics comparisons.
  const basics = good.filter((p) => p.basics).sort(basicsFirst);
  const basicsComparisons = comparisons.filter((c) => c.topic === BASICS_TOPIC);
  const others = good.filter((p) => !p.basics);
  const topics = [...new Set(comparisons.map((c) => c.topic))]
    .filter((t) => t !== BASICS_TOPIC)
    .sort(compareTopics);

  const comparisonItem = (c: Comparison) => (
    <Item
      key={c.id}
      active={isActive("comparison", c.id)}
      onClick={() => onNavigate({ type: "comparison", id: c.id })}
    >
      {c.title}
    </Item>
  );
  const patternItem = (p: Pattern) => (
    <Item
      key={p.id}
      active={isActive("pattern", p.id)}
      onClick={() => onNavigate({ type: "pattern", id: p.id })}
    >
      {p.title}
    </Item>
  );
  /** One h4 section per platform that has patterns in `list`. */
  const byProvider = (list: Pattern[]) =>
    providerOrder.map((provider) => {
      const items = list.filter((p) => p.provider === provider);
      if (!items.length) return null;
      return (
        <section key={provider}>
          <h4>
            <SectionIcon name={provider} />
            {providerLabels[provider]}
          </h4>
          <ul>{items.map(patternItem)}</ul>
        </section>
      );
    });

  return (
    <nav id="nav-panel" className="sidebar" aria-label="Patterns">
      <h1 className="app-title">
        <a href={HOME_HASH} aria-current={view.type === "home" ? "page" : undefined}>
          <img src="/favicon.svg" alt="" width="24" height="24" />
          Cloud Identity Patterns
        </a>
      </h1>

      <search className="nav-search">
        <label htmlFor="nav-search-input" className="visually-hidden">
          Filter patterns and comparisons
        </label>
        <input
          ref={searchRef}
          id="nav-search-input"
          type="search"
          placeholder="Filter…"
          title="Filter patterns and comparisons (press / to jump here)"
          aria-keyshortcuts="/"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              e.currentTarget.blur();
            }
          }}
        />
        <p className={filtering ? "nav-search-status" : "visually-hidden"} role="status">
          {filtering
            ? resultCount === 0
              ? "No matches."
              : `${resultCount} ${resultCount === 1 ? "match" : "matches"}`
            : ""}
        </p>
      </search>

      {(basics.length > 0 || basicsComparisons.length > 0) && (
        <section className="nav-group" aria-labelledby="nav-basics">
          <h2 id="nav-basics">
            <SectionIcon name="basics" />
            Basics
          </h2>
          {byProvider(basics)}
          {basicsComparisons.length > 0 && (
            <section>
              <h4>
                <SectionIcon name="compare" />
                Side by side
              </h4>
              <ul>{basicsComparisons.map(comparisonItem)}</ul>
            </section>
          )}
        </section>
      )}

      {topics.length > 0 && (
        <section className="nav-group" aria-labelledby="nav-compare">
          <h2 id="nav-compare">Comparisons</h2>
          {topics.map((topic) => (
            <section key={topic}>
              <h4>
                <SectionIcon name={topicIcon(topic)} />
                {topic}
              </h4>
              <ul>{comparisons.filter((c) => c.topic === topic).map(comparisonItem)}</ul>
            </section>
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="nav-group" aria-labelledby="nav-patterns">
          <h2 id="nav-patterns">Patterns</h2>
          {byProvider(others)}
        </section>
      )}

      {warnings.length > 0 && (
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
      )}
    </nav>
  );
};
