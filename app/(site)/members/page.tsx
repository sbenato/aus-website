import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveUruguayCompetitors, getPersonAvatars } from "@/lib/wca-api";
import { EmptyState } from "@/components/ui/EmptyState";
import { MembersGrid } from "@/components/members/MembersGrid";
import type { ActiveCompetitor } from "@/lib/types";

export const metadata: Metadata = {
  title: "Miembros",
  description: "Competidores activos en Uruguay según la WCA.",
};

export default function MembersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Miembros</h1>
        <p className="text-gray-500 mt-2">
          Competidores que participaron en torneos en Uruguay en los últimos 2
          años · ordenados por actividad
        </p>
      </div>
      <Suspense fallback={<MembersGridSkeleton />}>
        <MembersList />
      </Suspense>
    </div>
  );
}

async function MembersList() {
  let competitors: ActiveCompetitor[] = [];
  let avatarMap = new Map<string, string>();
  try {
    competitors = await getActiveUruguayCompetitors();
    avatarMap = await getPersonAvatars(competitors.map((c) => c.wca_id));
  } catch {
    // API unavailable
  }

  if (competitors.length === 0) {
    return (
      <EmptyState
        title="No se encontraron miembros"
        description="No se pudo cargar la lista de miembros. Intentá de nuevo más tarde."
        icon="👤"
      />
    );
  }

  const competitorsWithAvatars = competitors.map((c) => ({
    ...c,
    avatarUrl: avatarMap.get(c.wca_id),
  }));

  return <MembersGrid competitors={competitorsWithAvatars} />;
}

function MembersGridSkeleton() {
  return (
    <>
      <div className="h-4 w-44 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-3 animate-pulse"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}
