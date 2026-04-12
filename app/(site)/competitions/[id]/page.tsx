import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCompetitionById, getCompetitionStatus } from "@/lib/wca-api";
import { formatDateRange, formatDate } from "@/lib/format-time";
import { EventBadgeList } from "@/components/competitions/EventBadge";
import { CompetitionStatusBadge } from "@/components/competitions/CompetitionStatus";
import { Card, CardBody } from "@/components/ui/Card";
import type { WCAUser } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const comp = await getCompetitionById(id);
    return {
      title: comp.name,
      description: `Competencia WCA en ${comp.city}, Uruguay. ${formatDateRange(comp.start_date, comp.end_date)}.`,
    };
  } catch {
    return { title: "Competencia" };
  }
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;

  let comp;
  try {
    comp = await getCompetitionById(id);
  } catch {
    notFound();
  }

  const status = getCompetitionStatus(comp);
  const dateRange = formatDateRange(comp.start_date, comp.end_date);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/competitions" className="hover:text-brand-blue transition-colors">
          Competencias
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{comp.short_name ?? comp.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <CompetitionStatusBadge status={status} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-balance mb-3">
          {comp.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-500 text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dateRange}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {comp.city}, Uruguay
          </span>
          {comp.competitor_limit && (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {comp.competitor_limit} cubers máximo
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Events */}
          <Card>
            <CardBody>
              <h2 className="font-bold text-gray-900 mb-3">Eventos</h2>
              <EventBadgeList eventIds={comp.event_ids} />
            </CardBody>
          </Card>

          {/* Venue */}
          <Card>
            <CardBody>
              <h2 className="font-bold text-gray-900 mb-3">Lugar</h2>
              <div className="space-y-2 text-sm text-gray-600">
                {comp.venue && (
                  <p className="font-medium text-gray-900">{comp.venue}</p>
                )}
                {comp.venue_address && <p>{comp.venue_address}</p>}
                {comp.venue_details && (
                  <p className="text-gray-500 italic">{comp.venue_details}</p>
                )}
                {comp.latitude_degrees && comp.longitude_degrees && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${comp.latitude_degrees},${comp.longitude_degrees}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-blue hover:underline mt-1"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver en Google Maps
                  </a>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Delegates & Organizers */}
          {comp.delegates?.length > 0 && (
            <PersonList title="Delegados WCA" people={comp.delegates} />
          )}
          {comp.organizers?.length > 0 && (
            <PersonList title="Organizadores" people={comp.organizers} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Registration info */}
          {(comp.registration_open ?? comp.registration_close) && (
            <Card>
              <CardBody>
                <h3 className="font-bold text-gray-900 mb-3">Inscripción</h3>
                <div className="space-y-2 text-sm">
                  {comp.registration_open && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Apertura</p>
                      <p className="text-gray-900">
                        {formatDate(comp.registration_open.split("T")[0])}
                      </p>
                    </div>
                  )}
                  {comp.registration_close && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Cierre</p>
                      <p className="text-gray-900">
                        {formatDate(comp.registration_close.split("T")[0])}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* WCA link */}
          <Card>
            <CardBody>
              <a
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
              >
                Ver en WCA
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {comp.website && (
                <a
                  href={comp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-brand-blue text-brand-blue text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sitio oficial
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PersonList({ title, people }: { title: string; people: WCAUser[] }) {
  return (
    <Card>
      <CardBody>
        <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
        <ul className="space-y-3">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3">
              {person.avatar && !person.avatar.is_default ? (
                <Image
                  src={person.avatar.thumb_url}
                  alt={person.name}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {person.name[0]}
                </div>
              )}
              <div>
                {person.wca_id ? (
                  <a
                    href={`https://www.worldcubeassociation.org/persons/${person.wca_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-brand-blue transition-colors"
                  >
                    {person.name}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                )}
                {person.wca_id && (
                  <p className="text-xs text-gray-400 font-mono">{person.wca_id}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
