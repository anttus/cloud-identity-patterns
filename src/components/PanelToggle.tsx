type Props = {
  side: "left" | "right";
  open: boolean;
  /** What the panel holds, for the accessible name ("Hide pattern list"). */
  label: string;
  /** id of the panel element this button shows/hides. */
  controls: string;
  onToggle: () => void;
};

/** Chevron pointing the way the panel will move: toward its edge to hide, away to show. */
const Chevron = ({ pointsLeft }: { pointsLeft: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d={pointsLeft ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PanelToggle = ({ side, open, label, controls, onToggle }: Props) => {
  const action = `${open ? "Hide" : "Show"} ${label}`;
  const pointsLeft = side === "left" ? open : !open;
  return (
    <button
      type="button"
      className={`panel-toggle ${side}`}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={action}
      title={action}
      onClick={onToggle}
    >
      <Chevron pointsLeft={pointsLeft} />
    </button>
  );
};
