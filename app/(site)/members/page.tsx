import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActiveUruguayCompetitors, getPersonAvatars } from "@/lib/wca-api";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
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

  return (
    <>
      <p className="text-sm text-gray-400 mb-6">
        {competitors.length} competidores encontrados
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {competitors.map((c, idx) => (
          <MemberCard
            key={c.wca_id}
            competitor={c}
            rank={idx + 1}
            avatarUrl={avatarMap.get(c.wca_id)}
          />
        ))}
      </div>
    </>
  );
}

function MembersGridSkeleton() {
  return (
    <>
      <div className="h-4 w-44 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 16 }).map((_, i) => (
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

function MemberCard({
  competitor,
  rank,
  avatarUrl,
}: {
  competitor: ActiveCompetitor;
  rank: number;
  avatarUrl?: string;
}) {
  const { wca_id, name, country_iso2, uy_competition_count } = competitor;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isUruguayan = country_iso2 === "UY";

  return (
    <Card hover className="group">
      <CardBody className="flex flex-col items-center text-center gap-3 py-6">
        {/* Avatar with rank badge */}
        <div className="relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          {rank <= 3 && (
            <span className="absolute -top-1 -right-1 text-lg">
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
            </span>
          )}
        </div>

        {/* Name */}
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors text-balance">
            {name}
          </h3>
          <p className="text-xs text-gray-400 font-mono">{wca_id}</p>
          {!isUruguayan && (
            <p className="text-xs text-gray-400 mt-0.5">{country_iso2}</p>
          )}
        </div>

        {/* Uruguay competition count */}
        <div className="text-sm text-gray-500">
          <span title="Torneos en Uruguay (últimos 2 años)">
            🏆{" "}
            {uy_competition_count === 1
              ? "1 torneo en Uruguay"
              : `${uy_competition_count} torneos en Uruguay`}
          </span>
        </div>

        {/* Link */}
        <Link
          href={`/members/${wca_id}`}
          className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
        >
          Ver perfil →
        </Link>
      </CardBody>
    </Card>
  );
}
