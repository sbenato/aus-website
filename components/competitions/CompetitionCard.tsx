import Link from "next/link";
import type { WCACompetition } from "@/lib/types";
import { getCompetitionStatus } from "@/lib/wca-api";
import { formatDateRange } from "@/lib/format-time";
import { EventBadgeList } from "./EventBadge";
import { CompetitionStatusBadge } from "./CompetitionStatus";
import { Card } from "@/components/ui/Card";

interface CompetitionCardProps {
  competition: WCACompetition;
}

export function CompetitionCard({ competition: comp }: CompetitionCardProps) {
  const status = getCompetitionStatus(comp);
  const dateRange = formatDateRange(comp.start_date, comp.end_date);

  return (
    <Card hover className="flex flex-col overflow-hidden group">
      <div className="p-5 flex flex-col h-full gap-3">
        {/* Status + date */}
        <div className="flex items-start justify-between gap-2">
          <CompetitionStatusBadge status={status} />
          <time
            dateTime={comp.start_date}
            className="text-xs text-gray-400 shrink-0"
          >
            {dateRange}
          </time>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors leading-snug text-balance">
          {comp.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {comp.city}
        </div>

        {/* Events */}
        <div className="flex-1">
          <EventBadgeList eventIds={comp.event_ids} max={8} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          {comp.competitor_limit ? (
            <span className="text-xs text-gray-400">
              Límite: {comp.competitor_limit} cubers
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/competitions/${comp.id}`}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
          >
            Ver detalles →
          </Link>
        </div>
      </div>
    </Card>
  );
}
