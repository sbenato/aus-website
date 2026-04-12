"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface LoginButtonProps {
  callbackUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoginButton({
  callbackUrl = "/dashboard",
  className = "",
  size = "md",
}: LoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      onClick={() => {
        setLoading(true);
        signIn("wca", { callbackUrl });
      }}
      disabled={loading}
      className={[
        "inline-flex items-center gap-3 rounded-lg font-semibold",
        "bg-brand-blue text-white hover:bg-brand-blue-dark",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <WCALogo className="h-5 w-5 shrink-0" />
      )}
      {loading ? "Conectando…" : "Ingresar con WCA"}
    </button>
  );
}

function WCALogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="12" fill="white" fillOpacity="0.2" />
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontSize="44"
        fontWeight="bold"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        WCA
      </text>
    </svg>
  );
}
