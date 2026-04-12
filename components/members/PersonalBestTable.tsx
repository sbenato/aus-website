import type { WCAPersonalRecords } from "@/lib/types";
import { formatWCATime } from "@/lib/format-time";
import { EVENT_ORDER, getEventInfo } from "@/lib/wca-events";

interface PersonalBestTableProps {
  personalRecords: WCAPersonalRecords;
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
              Rank Mundial
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Media
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">
              Rank País
            </th>
            <th className="text-right py-3 px-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">
              Rank Mundial
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {eventIds.map((eventId) => {
            const record = personalRecords[eventId];
            const event = getEventInfo(eventId);
            const { single, average } = record;

            return (
              <tr key={eventId} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-3 font-medium text-gray-900">
                  {event.nameEs}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900">
                  {single ? formatWCATime(single.best, eventId) : "—"}
                </td>
                <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                  {single ? `#${single.country_rank}` : "—"}
                </td>
                <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                  {single ? `#${single.world_rank.toLocaleString()}` : "—"}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900">
                  {average ? formatWCATime(average.best, eventId) : "—"}
                </td>
                <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                  {average ? `#${average.country_rank}` : "—"}
                </td>
                <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
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
