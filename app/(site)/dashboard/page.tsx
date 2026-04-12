import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { getPersonByWcaId } from "@/lib/wca-api";
import { PersonalBestTable } from "@/components/members/PersonalBestTable";
import { MedalCount } from "@/components/members/MedalCount";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Mi Perfil",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { user } = session;

  let wcaPerson = null;
  if (user.wcaId) {
    try {
      wcaPerson = await getPersonByWcaId(user.wcaId);
    } catch {
      // Profile not yet available
    }
  }

  const delegateLabels: Record<string, string> = {
    delegate: "Delegado WCA",
    senior_delegate: "Delegado Senior WCA",
    junior_delegate: "Delegado Junior WCA",
    trainee_delegate: "Delegado en Entrenamiento",
    regional_organisation_leader: "Líder de Organización Regional",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardBody className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              width={96}
              height={96}
              className="rounded-full border-4 border-white shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-blue text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {(user.name ?? "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.delegateStatus && delegateLabels[user.delegateStatus] && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/20 text-amber-800">
                  ⭐ {delegateLabels[user.delegateStatus]}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {user.wcaId && (
                <a
                  href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-brand-blue hover:underline font-semibold"
                >
                  {user.wcaId}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {user.countryIso2 && (
                <span>🌎 Uruguay</span>
              )}
              {user.email && (
                <span className="hidden sm:block">{user.email}</span>
              )}
            </div>

            {!user.wcaId && (
              <div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg px-3 py-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Aún no has competido en ninguna competencia WCA oficial.
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      {wcaPerson && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            value={String(wcaPerson.competition_count)}
            label="Competencias"
            icon="🏆"
          />
          {wcaPerson.total_solves !== undefined && (
            <StatCard
              value={wcaPerson.total_solves.toLocaleString()}
              label="Soluciones"
              icon="🔢"
            />
          )}
          <StatCard
            value={String(wcaPerson.medals.total)}
            label="Medallas"
            icon="🎖️"
          />
          <StatCard
            value={String(wcaPerson.records.national)}
            label="Records Nacionales"
            icon="🇺🇾"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Bests */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-gray-900">Records Personales</h2>
            </CardHeader>
            <CardBody className="p-0">
              {wcaPerson?.personal_records ? (
                <PersonalBestTable personalRecords={wcaPerson.personal_records} />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">
                    {user.wcaId
                      ? "No se pudieron cargar los records personales."
                      : "Competí en una competencia WCA para ver tus records."}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Medals + WCA Link */}
        <div className="flex flex-col gap-6">
          {wcaPerson && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-900">Medallas</h2>
              </CardHeader>
              <CardBody className="flex justify-center">
                <MedalCount medals={wcaPerson.medals} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody className="flex flex-col gap-3">
              <h3 className="font-semibold text-gray-900">Perfil WCA</h3>
              {user.wcaId ? (
                <a
                  href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
                >
                  Ver en WCA
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="text-sm text-gray-500">
                  Obtené tu ID WCA participando en una{" "}
                  <Link href="/competitions" className="text-brand-blue hover:underline">
                    competencia oficial
                  </Link>.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
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
