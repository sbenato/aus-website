import type { CompetitionStatus } from "@/lib/types";

interface CompetitionStatusBadgeProps {
  status: CompetitionStatus;
}

const statusConfig: Record<
  CompetitionStatus,
  { label: string; className: string }
> = {
  cancelled: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800",
  },
  past: {
    label: "Finalizada",
    className: "bg-gray-100 text-gray-600",
  },
  in_progress: {
    label: "En curso",
    className: "bg-green-100 text-green-800 animate-pulse",
  },
  registration_open: {
    label: "Inscripción abierta",
    className: "bg-green-100 text-green-800",
  },
  upcoming: {
    label: "Próxima",
    className: "bg-blue-100 text-brand-blue",
  },
};

export function CompetitionStatusBadge({ status }: CompetitionStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
