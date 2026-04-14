import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonByWcaId, getAusRoleByWcaId } from "@/lib/wca-api";
import { RoleCountsCard } from "@/components/members/RoleCountsCard";
import { PersonalBestTable } from "@/components/members/PersonalBestTable";
import { MedalCount } from "@/components/members/MedalCount";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const DELEGATE_STATUS_LABELS: Record<string, string> = {
  candidate_delegate: "Delegado Candidato WCA",
  delegate: "Delegado WCA",
  senior_delegate: "Delegado Senior WCA",
  regional_organizer: "Organizador Regional WCA",
};

const WCA_TEAM_NAMES: Record<string, string> = {
  "wca-board":  "WCA Board",
  "wqac":       "WCA Quality Assurance Committee",
  "wrc":        "WCA Regulations Committee",
  "wdc":        "WCA Disciplinary Committee",
  "wec":        "WCA Ethics Committee",
  "wfc":        "WCA Finance Committee",
  "wac":        "WCA Advisory Council",
  "wat":        "WCA Advisory Team",
  "wmt":        "WCA Marketing Team",
  "wit":        "WCA IT Team",
  "wst":        "WCA Software Team",
  "wct":        "WCA Communications Team",
  "weat":       "WCA Education and Accessibility Team",
  "wrt":        "WCA Results Team",
  "wsat":       "WCA Speed Solving Algorithms Team",
};

interface Props {
  params: Promise<{ wca_id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wca_id } = await params;
  try {
    const data = await getPersonByWcaId(wca_id);
    return {
      title: data.person.name,
      description: `Perfil de ${data.person.name} en AUS. ${data.competition_count} competencias.`,
    };
  } catch {
    return { title: "Miembro" };
  }
}

export default async function MemberProfilePage({ params }: Props) {
  const { wca_id } = await params;

  let data;
  try {
    data = await getPersonByWcaId(wca_id);
  } catch {
    notFound();
  }

  const ausRole = await getAusRoleByWcaId(wca_id);

  const { person, medals, competition_count, total_solves, records, personal_records } = data;


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/members" className="hover:text-brand-blue transition-colors">
          Miembros
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{person.name}</span>
      </nav>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardBody className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {person.avatar && !person.avatar.is_default ? (
            <Image
              src={person.avatar.thumb_url}
              alt={person.name}
              width={96}
              height={96}
              className="rounded-full border-4 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-blue text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {person.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {person.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-gray-500">
              <a
                href={`https://www.worldcubeassociation.org/persons/${person.wca_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-brand-blue hover:underline font-semibold"
              >
                {person.wca_id}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <span>{person.country.name}</span>
            </div>
            {(person.delegate_status || ausRole || (person.teams && person.teams.length > 0)) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {person.delegate_status && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/20 text-amber-800">
                    ⭐ {DELEGATE_STATUS_LABELS[person.delegate_status] ?? "Delegado WCA"}
                  </span>
                )}
                {ausRole && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-blue/10 text-brand-blue">
                    🇺🇾 {ausRole}
                  </span>
                )}
                {person.teams?.map((team) => (
                  <span
                    key={team.friendly_id}
                    title={WCA_TEAM_NAMES[team.friendly_id] ?? team.friendly_id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700"
                  >
                    {team.leader ? "★ " : ""}{WCA_TEAM_NAMES[team.friendly_id] ?? team.friendly_id.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <StatCard value={String(competition_count)} label="Competencias" icon="🏆" />
        {total_solves !== undefined && (
          <StatCard value={total_solves.toLocaleString()} label="Soluciones" icon="🔢" />
        )}
        <StatCard value={String(medals.total)} label="Medallas" icon="🎖️" />
        <RecordsCard records={records} />
        <RoleCountsCard wcaId={wca_id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Bests */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900">Records Personales</h2>
            </CardHeader>
            <CardBody className="p-0">
              {personal_records ? (
                <PersonalBestTable personalRecords={personal_records} />
              ) : (
                <div className="p-8 text-center text-sm text-gray-400">
                  No hay records personales disponibles.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Medals + WCA Link */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900">Medallas</h2>
            </CardHeader>
            <CardBody className="flex justify-center">
              <MedalCount medals={medals} />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <a
                href={`https://www.worldcubeassociation.org/persons/${person.wca_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
              >
                Ver en WCA
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </CardBody>
          </Card>
        </div>
      </div>

    </div>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <Card>
      <CardBody className="text-center py-5">
        <div className="text-2xl mb-1">{icon}</div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </CardBody>
    </Card>
  );
}


function RecordsCard({ records }: { records: { national: number; continental: number; world: number } }) {
  const items = [
    { key: "WR", count: records.world,       color: "text-red-600",   bg: "bg-red-100"   },
    { key: "CR", count: records.continental, color: "text-amber-600", bg: "bg-amber-100" },
    { key: "NR", count: records.national,    color: "text-blue-600",  bg: "bg-blue-100"  },
  ].filter((r) => r.count > 0);

  const total = records.national + records.continental + records.world;

  return (
    <Card>
      <CardBody className="text-center py-5">
        <div className="text-2xl mb-1">🏅</div>
        <p className="text-2xl font-bold text-gray-900">{total}</p>
        <p className="text-xs text-gray-500 mt-0.5">Records</p>
        {items.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
            {items.map(({ key, count, color, bg }) => (
              <span
                key={key}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold ${color} ${bg}`}
              >
                {count} {key}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
