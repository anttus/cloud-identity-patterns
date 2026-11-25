import type { ReactNode } from "react";

/**
 * Small glyphs for sidebar section titles. Simplified, recognisable shapes in each
 * platform's colour rather than official logos: inline SVG keeps the strict CSP
 * (no external images) and works in light and dark mode.
 */
export type IconName = "kubernetes" | "azure" | "aws" | "gcp" | "generic" | "warning" | "cicd";

// Seven spokes for the Kubernetes helm wheel, computed once.
const spokes = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * 2 * Math.PI - Math.PI / 2;
  return { x: 8 + Math.cos(a) * 4.6, y: 8 + Math.sin(a) * 4.6 };
});
const heptagon = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * 2 * Math.PI - Math.PI / 2;
  return `${(8 + Math.cos(a) * 7.4).toFixed(2)},${(8 + Math.sin(a) * 7.4).toFixed(2)}`;
}).join(" ");

const glyphs: Record<IconName, { color: string; body: ReactNode }> = {
  kubernetes: {
    color: "#326ce5",
    body: (
      <>
        <polygon points={heptagon} fill="currentColor" />
        <circle cx="8" cy="8" r="4.6" fill="none" stroke="#fff" strokeWidth="1.2" />
        {spokes.map((p) => (
          <line
            key={`${p.x}-${p.y}`}
            x1="8"
            y1="8"
            x2={p.x}
            y2={p.y}
            stroke="#fff"
            strokeWidth="1.1"
          />
        ))}
        <circle cx="8" cy="8" r="1.3" fill="#fff" />
      </>
    ),
  },
  azure: {
    color: "#0078d4",
    body: (
      <>
        <path d="M6.2 1.5 1 14h4.2L9.6 3.4z" fill="currentColor" />
        <path d="M10 5.2 7.4 11.6l3.4 1.2H5.6L4.9 14.5H15z" fill="currentColor" opacity=".7" />
      </>
    ),
  },
  aws: {
    color: "#ff9900",
    body: (
      <>
        <path
          d="M4.5 10.5a3 3 0 0 1 .4-6 4 4 0 0 1 7.2 1.1 2.5 2.5 0 0 1-.6 4.9z"
          fill="currentColor"
          opacity=".35"
        />
        <path
          d="M2.5 12.3c3.4 2 7.6 2 11 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="m12.2 11.2 1.6 1-.9 1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </>
    ),
  },
  gcp: {
    color: "#4285f4",
    body: (
      <>
        <polygon points="8,1 14.1,4.5 14.1,11.5 8,15 1.9,11.5 1.9,4.5" fill="currentColor" />
        <circle cx="8" cy="8" r="2.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      </>
    ),
  },
  generic: {
    color: "var(--fg-muted)",
    body: (
      <path
        d="M8 1.2 2.5 3.4v4.1c0 3.4 2.3 6.1 5.5 7.3 3.2-1.2 5.5-3.9 5.5-7.3V3.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    ),
  },
  warning: {
    color: "var(--c-warning)",
    body: (
      <>
        <path d="M8 1.5 15 14H1z" fill="currentColor" />
        <path d="M8 6v3.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.7" r=".9" fill="#fff" />
      </>
    ),
  },
  cicd: {
    color: "#8b5cf6",
    body: (
      <>
        <path
          d="M2.5 8a5.5 5.5 0 0 1 9.6-3.6M13.5 8a5.5 5.5 0 0 1-9.6 3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12.6 1.8v2.9H9.7M3.4 14.2v-2.9h2.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    ),
  },
};

/** Sidebar topics → glyph. Unknown topics get the neutral shield. */
export const topicIcon = (topic: string): IconName =>
  topic === "Kubernetes" ? "kubernetes" : topic === "CI/CD" ? "cicd" : "generic";

export const SectionIcon = ({ name }: { name: IconName }) => {
  const { color, body } = glyphs[name];
  return (
    <svg className="section-icon" viewBox="0 0 16 16" style={{ color }} aria-hidden="true">
      {body}
    </svg>
  );
};
