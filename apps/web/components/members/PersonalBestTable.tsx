import type { WCAPersonalBest, WCAPersonalRecords } from "@/lib/types";
import { formatWCATime } from "@/lib/format-time";
import { EVENT_ORDER, getEventInfo } from "@/lib/wca-events";

interface PersonalBestTableProps {
  personalRecords: WCAPersonalRecords;
}

function getBestRank(
  personalRecords: WCAPersonalRecords,
  eventId: string,
  key: "country_rank" | "continent_rank" | "world_rank"
): number {
  const r = personalRecords[eventId];
  const ranks = [r.single?.[key], r.average?.[key]].filter(
    (v): v is number => v !== undefined
  );
  return ranks.length ? Math.min(...ranks) : Infinity;
}

type RecordLevel = "WR" | "CR" | "NR" | null;

function getRecordLevel(pb: WCAPersonalBest): RecordLevel {
  if (pb.world_rank === 1) return "WR";
  if (pb.continent_rank === 1) return "CR";
  if (pb.country_rank === 1) return "NR";
  return null;
}

const RECORD_STYLES: Record<
  NonNullable<RecordLevel>,
  { text: string; bg: string; ring: string; badge: string }
> = {
  NR: {
    text: "text-blue-700",
    bg: "bg-blue-100",
    ring: "ring-blue-300",
    badge: "text-blue-600",
  },
  CR: {
    text: "text-amber-700",
    bg: "bg-amber-100",
    ring: "ring-amber-300",
    badge: "text-amber-600",
  },
  WR: {
    text: "text-red-700",
    bg: "bg-red-100",
    ring: "ring-red-300",
    badge: "text-red-600",
  },
};

function ResultCell({
  pb,
  eventId,
}: {
  pb: WCAPersonalBest | undefined;
  eventId: string;
}) {
  if (!pb) return <span className="text-gray-900 font-mono font-semibold">—</span>;

  const level = getRecordLevel(pb);
  const styles = level ? RECORD_STYLES[level] : null;

  return (
    <span
      className={`font-mono font-semibold ${styles ? styles.text : "text-gray-900"}`}
    >
      {styles ? (
        <span className="inline-flex items-center gap-1">
          <span className={`${styles.bg} ${styles.ring} px-1.5 py-0.5 rounded ring-1`}>
            {formatWCATime(pb.best, eventId)}
          </span>
          <span className={`text-xs font-bold ${styles.badge}`}>{level}</span>
        </span>
      ) : (
        formatWCATime(pb.best, eventId)
      )}
    </span>
  );
}

export function PersonalBestTable({ personalRecords }: PersonalBestTableProps) {
  const eventIds = EVENT_ORDER.filter((id) => personalRecords[id]);

  if (eventIds.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Sin records personales registrados.
      </p>
    );
  }

  const sortedEventIds = [...eventIds].sort((a, b) => {
    const nr =
      getBestRank(personalRecords, a, "country_rank") -
      getBestRank(personalRecords, b, "country_rank");
    if (nr !== 0) return nr;
    const cr =
      getBestRank(personalRecords, a, "continent_rank") -
      getBestRank(personalRecords, b, "continent_rank");
    if (cr !== 0) return cr;
    return (
      getBestRank(personalRecords, a, "world_rank") -
      getBestRank(personalRecords, b, "world_rank")
    );
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Evento
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Single
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">
              Rank País
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">
              Rank Cont.
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">
              Rank Mundial
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Media
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">
              Rank País
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">
              Rank Cont.
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">
              Rank Mundial
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sortedEventIds.map((eventId) => {
            const record = personalRecords[eventId];
            const event = getEventInfo(eventId);
            const { single, average } = record;

            return (
              <tr key={eventId} className="hover:bg-gray-50 transition-colors">
                {/* Event icon */}
                <td className="py-3 px-3">
                  <span
                    className={`cubing-icon event-${eventId}`}
                    title={event.nameEs}
                    aria-label={event.nameEs}
                    style={{ fontSize: "1.5rem", lineHeight: 1 }}
                  />
                </td>

                {/* Single */}
                <td className="py-3 px-3 text-right">
                  <ResultCell pb={single} eventId={eventId} />
                </td>

                {/* Single country rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                  {single ? `#${single.country_rank}` : "—"}
                </td>

                {/* Single continent rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                  {single ? `#${single.continent_rank.toLocaleString()}` : "—"}
                </td>

                {/* Single world rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden lg:table-cell">
                  {single ? `#${single.world_rank.toLocaleString()}` : "—"}
                </td>

                {/* Average */}
                <td className="py-3 px-3 text-right">
                  <ResultCell pb={average} eventId={eventId} />
                </td>

                {/* Average country rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                  {average ? `#${average.country_rank}` : "—"}
                </td>

                {/* Average continent rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                  {average ? `#${average.continent_rank.toLocaleString()}` : "—"}
                </td>

                {/* Average world rank */}
                <td className="py-3 px-3 text-right text-gray-500 hidden lg:table-cell">
                  {average ? `#${average.world_rank.toLocaleString()}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
