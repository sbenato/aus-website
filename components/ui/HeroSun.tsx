export function HeroSun() {
  return (
    <div className="relative flex items-center justify-center select-none" aria-hidden="true">
      <div className="absolute w-48 h-48 rounded-full bg-brand-gold/25 blur-3xl" />
      <svg
        viewBox="-220 -220 440 440"
        className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96"
        style={{ filter: "drop-shadow(0 0 32px rgba(245, 196, 24, 0.35))", animation: "spin 600s linear infinite" }}
      >
        <path d="M46,-68 Q56,-68 56,-78 L56,-168 Q56,-178 46,-178 Q-46,-178 -56,-78 Q-56,-68 -46,-68 L46,-68 Z" fill="#F5C518" />
        <path d="M68,46 Q68,56 78,56 L168,56 Q178,56 178,46 Q178,-46 78,-56 Q68,-56 68,-46 L68,46 Z" fill="#F5C518" />
        <path d="M-46,68 Q-56,68 -56,78 L-56,168 Q-56,178 -46,178 Q46,178 56,78 Q56,68 46,68 L-46,68 Z" fill="#F5C518" />
        <path d="M-68,-46 Q-68,-56 -78,-56 L-168,-56 Q-178,-56 -178,-46 Q-178,46 -78,56 Q-68,56 -68,46 L-68,-46 Z" fill="#F5C518" />
        <rect x="-56" y="-56" width="112" height="112" rx="10" fill="#F5C518" />
      </svg>
    </div>
  );
}
