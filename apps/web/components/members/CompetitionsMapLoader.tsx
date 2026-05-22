"use client";

import dynamic from "next/dynamic";

const CompetitionsMap = dynamic(
  () => import("@/components/members/CompetitionsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-sm text-gray-400">
        Cargando mapa…
      </div>
    ),
  }
);

export function CompetitionsMapLoader({ wcaId }: { wcaId: string }) {
  return <CompetitionsMap wcaId={wcaId} />;
}
