interface AUSLogoProps {
  className?: string;
  variant?: "color" | "white";
}

export function AUSLogo({ className = "h-8 w-8", variant = "color" }: AUSLogoProps) {
  const bg = variant === "white" ? "white" : "#0070BD";
  const text = variant === "white" ? "#0070BD" : "white";
  const accent = "#f5c518";

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AUS Logo"
    >
      {/* Cube background */}
      <rect width="100" height="100" rx="18" fill={bg} />

      {/* Stylized 3D cube */}
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="none" stroke={text} strokeWidth="4" strokeLinejoin="round" />
      <line x1="50" y1="18" x2="50" y2="50" stroke={text} strokeWidth="3" />
      <line x1="50" y1="50" x2="78" y2="34" stroke={text} strokeWidth="3" />
      <line x1="50" y1="50" x2="22" y2="34" stroke={text} strokeWidth="3" />
      <line x1="50" y1="50" x2="50" y2="82" stroke={text} strokeWidth="3" />

      {/* Accent dot - Sun of May */}
      <circle cx="50" cy="50" r="5" fill={accent} />
    </svg>
  );
}
