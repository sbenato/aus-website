import { getEventInfo } from "@/lib/wca-events";

interface EventBadgeProps {
  eventId: string;
  showName?: boolean;
}

export function EventBadge({ eventId, showName = false }: EventBadgeProps) {
  const event = getEventInfo(eventId);

  return (
    <span
      title={event.nameEs}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-brand-blue border border-blue-100"
    >
      {showName ? event.nameEs : event.shortName}
    </span>
  );
}

export function EventBadgeList({
  eventIds,
  max,
}: {
  eventIds: string[];
  max?: number;
}) {
  const visible = max ? eventIds.slice(0, max) : eventIds;
  const hidden = max ? Math.max(0, eventIds.length - max) : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((id) => (
        <EventBadge key={id} eventId={id} />
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
          +{hidden}
        </span>
      )}
    </div>
  );
}
