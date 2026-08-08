import type { RecordFund } from "./types";

export const money = (n: number) =>
  `$${Math.round(n).toLocaleString("es-UY")}`;

export const money2 = (n: number) =>
  `$${n.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

/** Unidad del resultado: FMC son movimientos, MBLD son puntos, el resto segundos. */
export function unidad(fund: Pick<RecordFund, "eventId" | "inverted">): string {
  if (fund.inverted) return "puntos";
  if (fund.eventId === "333fm") return "movimientos";
  return "segundos";
}

export function kindLabel(kind: "single" | "average"): string {
  return kind === "average" ? "media" : "single";
}

export function fundLabel(fund: Pick<RecordFund, "name" | "kind">): string {
  return `${fund.name} · ${kindLabel(fund.kind)}`;
}

/** Un resultado tal como se muestra: 6.00 s, 24 movimientos, 13 puntos. */
export function valueLabel(
  fund: Pick<RecordFund, "eventId" | "inverted">,
  value: number
): string {
  if (!(value > 0)) return "—";
  if (fund.inverted) return `${Math.round(value)} puntos`;
  if (fund.eventId === "333fm") return `${value.toFixed(2)} mov.`;
  return `${value.toFixed(2)} s`;
}

/**
 * Zona fija: sin esto el servidor (UTC en Vercel) y el navegador (UY, −3)
 * renderizan horas —y a veces días— distintos, y React tira mismatch de
 * hidratación en cada fecha del historial.
 */
const TZ = process.env.NEXT_PUBLIC_AUS_TZ ?? "America/Montevideo";

export function fechaCorta(iso: string): string {
  if (!iso) return "—";
  // Una fecha ISO sin zona se interpreta como local; forzamos UTC y formateamos
  // en la zona fija para que no se corra un día.
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** Años/meses/días desde que se marcó el récord, en corto. */
export function antiguedad(days: number): string {
  if (days <= 0) return "hoy";
  if (days < 60) return `${days} d`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} meses`;
  return `${(days / 365.25).toFixed(1)} años`;
}
