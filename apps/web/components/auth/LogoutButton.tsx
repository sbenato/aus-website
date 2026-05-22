"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/" });
      }}
      disabled={loading}
      className={[
        "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md",
        "transition-colors duration-150 disabled:opacity-50",
        className,
      ].join(" ")}
    >
      {loading ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
