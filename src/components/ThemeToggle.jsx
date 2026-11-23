export default function ThemeToggle({ theme, onToggle, className = "theme-toggle", iconSize = 16 }) {
  const dark = theme === "dark";
  const svgProps = {
    viewBox: "0 0 24 24",
    width: iconSize,
    height: iconSize,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-label={dark ? "Switch to day mode" : "Switch to dark mode"}
      aria-pressed={dark}
      title={dark ? "Switch to Day Mode" : "Switch to Dark Mode"}
    >
      {dark ? (
        <>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <span className="theme-toggle__label">Day</span>
        </>
      ) : (
        <>
          <svg {...svgProps}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <span className="theme-toggle__label">Dark</span>
        </>
      )}
    </button>
  );
}
