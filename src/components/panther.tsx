/** Original line-art panther. Stroke draws in, then the platinum fill rises. */
export function PantherMark({ drawn }: { drawn: boolean }) {
  return (
    <svg
      className={`panther ${drawn ? "is-drawn" : ""}`}
      viewBox="0 0 220 160"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="panther-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#e5e4e2" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
      </defs>
      <path
        className="panther-path"
        d="M38 96c2-14 12-24 24-22 2-12 14-20 26-16 4-10 16-14 24-8 6 4 8 12 6 18 10-2 22 4 26 16 8-6 22-2 28 10 6 12 2 26-10 32 8 4 12 16 6 26-8 12-24 14-34 6-2 12-16 22-30 18-10-2-16-12-16-22-12 8-28 4-34-10-4-10-2-18 4-24-10-6-14-18-8-28 2-4 4-6 8-6-2-6-2-14 0-16z"
      />
      <path className="panther-path" d="M78 70c6-2 12 2 12 8" />
      <path className="panther-path" d="M62 78c8 1 10 6 6 10" />
      <path className="panther-path" d="M148 86c10 2 16 12 12 20-6 10-18 8-22-2" />
      <path className="panther-path ear" d="M86 52l8-16 6 14" />
      <path className="panther-path ear" d="M104 50l6-18 8 16" />
    </svg>
  );
}
