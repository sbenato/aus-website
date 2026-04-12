import type { Metadata } from "next";
import { getUruguayCompetitions } from "@/lib/wca-api";
import { CompetitionCard } from "@/components/competitions/CompetitionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrganizeCTA } from "@/components/ui/OrganizeCTA";

export const metadata: Metadata = {
  title: "Competencias",
  description:
    "Todas las competencias WCA de speedcubing en Uruguay: próximas y pasadas.",
};

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function CompetitionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = (params.filter ?? "upcoming") as "upcoming" | "past" | "all";
  const page = Number(params.page ?? 1);

  let competitions: Awaited<ReturnType<typeof getUruguayCompetitions>> = [];
  try {
    competitions = await getUruguayCompetitions({
      upcoming: filter === "upcoming",
      past: filter === "past",
      page,
      perPage: 24,
    });
  } catch {
    // API unavailable
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Competencias</h1>
        <p className="text-gray-500 mt-2">
          Competencias WCA oficiales celebradas en Uruguay
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {(
          [
            { value: "upcoming", label: "Próximas" },
            { value: "past", label: "Pasadas" },
            { value: "all", label: "Todas" },
          ] as const
        ).map((tab) => (
          <a
            key={tab.value}
            href={`?filter=${tab.value}`}
            className={[
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-white shadow-sm text-brand-blue"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Grid */}
      {competitions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp) => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            filter === "upcoming"
              ? "No hay competencias próximas"
              : "No hay competencias registradas"
          }
          description={
            filter === "upcoming"
              ? "Seguí @aus.uy en Instagram para enterarte de las próximas competencias."
              : "No se encontraron competencias para los filtros seleccionados."
          }
          icon="🏆"
        />
      )}

      {/* Pagination */}
      {competitions.length === 24 && (
        <div className="flex justify-center gap-3 mt-10">
          {page > 1 && (
            <a
              href={`?filter=${filter}&page=${page - 1}`}
              className="px-4 py-2 text-sm font-medium text-brand-blue border border-brand-blue rounded-lg hover:bg-blue-50 transition-colors"
            >
              ← Anterior
            </a>
          )}
          <a
            href={`?filter=${filter}&page=${page + 1}`}
            className="px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
          >
            Siguiente →
          </a>
        </div>
      )}

    </div>
    <OrganizeCTA />
    </>
  );
}
