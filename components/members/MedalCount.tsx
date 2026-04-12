interface MedalCountProps {
  medals: {
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  compact?: boolean;
}

export function MedalCount({ medals, compact = false }: MedalCountProps) {
  if (medals.total === 0) {
    return <span className="text-sm text-gray-400">Sin medallas</span>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {medals.gold > 0 && (
          <span className="flex items-center gap-1">
            <span>🥇</span>
            <span className="font-semibold">{medals.gold}</span>
          </span>
        )}
        {medals.silver > 0 && (
          <span className="flex items-center gap-1">
            <span>🥈</span>
            <span className="font-semibold">{medals.silver}</span>
          </span>
        )}
        {medals.bronze > 0 && (
          <span className="flex items-center gap-1">
            <span>🥉</span>
            <span className="font-semibold">{medals.bronze}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <MedalPill emoji="🥇" count={medals.gold} label="Oro" />
      <MedalPill emoji="🥈" count={medals.silver} label="Plata" />
      <MedalPill emoji="🥉" count={medals.bronze} label="Bronce" />
    </div>
  );
}

function MedalPill({
  emoji,
  count,
  label,
}: {
  emoji: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg font-bold text-gray-900">{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
