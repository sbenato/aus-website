import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getUruguayPersons } from "@/lib/wca-api";
import { MedalCount } from "@/components/members/MedalCount";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { WCAPerson } from "@/lib/types";

export const metadata: Metadata = {
  title: "Miembros",
  description: "Todos los competidores uruguayos registrados en la WCA.",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  let persons: WCAPerson[] = [];
  try {
    persons = await getUruguayPersons(page);
  } catch {
    // API unavailable
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Miembros</h1>
        <p className="text-gray-500 mt-2">
          Competidores uruguayos registrados en la World Cube Association
        </p>
      </div>

      {persons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {persons.map((p) => (
            <MemberCard key={p.person.wca_id ?? p.person.id} person={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No se encontraron miembros"
          description="No se pudo cargar la lista de miembros. Intentá de nuevo más tarde."
          icon="👤"
        />
      )}

      {/* Pagination */}
      {persons.length === 24 && (
        <div className="flex justify-center gap-3 mt-10">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="px-4 py-2 text-sm font-medium text-brand-blue border border-brand-blue rounded-lg hover:bg-blue-50 transition-colors"
            >
              ← Anterior
            </a>
          )}
          <a
            href={`?page=${page + 1}`}
            className="px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
          >
            Siguiente →
          </a>
        </div>
      )}
    </div>
  );
}

function MemberCard({ person: p }: { person: WCAPerson }) {
  const { person, medals, competition_count } = p;
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card hover className="group">
      <CardBody className="flex flex-col items-center text-center gap-3 py-6">
        {/* Avatar */}
        {person.avatar && !person.avatar.is_default ? (
          <Image
            src={person.avatar.thumb_url}
            alt={person.name}
            width={64}
            height={64}
            className="rounded-full border-2 border-white shadow"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        )}

        {/* Name */}
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors text-balance">
            {person.name}
          </h3>
          {person.wca_id && (
            <p className="text-xs text-gray-400 font-mono">{person.wca_id}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span title="Competencias">🏆 {competition_count}</span>
          {medals.total > 0 && (
            <MedalCount medals={medals} compact />
          )}
        </div>

        {/* Link */}
        {person.wca_id && (
          <Link
            href={`/members/${person.wca_id}`}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
          >
            Ver perfil →
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
