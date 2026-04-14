"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import type { ActiveCompetitor } from "@/lib/types";

const PAGE_SIZE = 12;

type CompetitorWithAvatar = ActiveCompetitor & { avatarUrl?: string };

export function MembersGrid({ competitors }: { competitors: CompetitorWithAvatar[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = competitors.slice(0, visibleCount);
  const hasMore = visibleCount < competitors.length;

  return (
    <>
      <p className="text-sm text-gray-400 mb-6">
        Mostrando {visible.length} de {competitors.length} competidores
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visible.map((c, idx) => (
          <MemberCard key={c.wca_id} competitor={c} rank={idx + 1} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount((n) => n * 2)}
            className="px-6 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            Cargar más ({competitors.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </>
  );
}

function MemberCard({
  competitor,
  rank,
}: {
  competitor: CompetitorWithAvatar;
  rank: number;
}) {
  const { wca_id, name, country_iso2, uy_competition_count, avatarUrl } = competitor;

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

        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors text-balance">
            {name}
          </h3>
          <p className="text-xs text-gray-400 font-mono">{wca_id}</p>
          {!isUruguayan && (
            <p className="text-xs text-gray-400 mt-0.5">{country_iso2}</p>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <span title="Torneos en Uruguay (últimos 2 años)">
            🏆{" "}
            {uy_competition_count === 1
              ? "1 torneo en Uruguay"
              : `${uy_competition_count} torneos en Uruguay`}
          </span>
        </div>

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
