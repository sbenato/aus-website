/**
 * Formats a WCA result (stored as centiseconds) into a human-readable string.
 * Special values: -1 = DNF, -2 = DNS, 0 = no result
 */
export function formatWCATime(centiseconds: number, eventId?: string): string {
  if (centiseconds === -1) return "DNF";
  if (centiseconds === -2) return "DNS";
  if (centiseconds === 0) return "—";

  // Fewest Moves: value is the move count directly
  if (eventId === "333fm") {
    return String(centiseconds);
  }

  // Multi-Blind: special encoding
  // value = (99 - points) * 1e7 + time_seconds * 100 + missed
  if (eventId === "333mbf") {
    const missed = centiseconds % 100;
    const seconds = Math.floor((centiseconds % 1e7) / 100);
    const points = 99 - Math.floor(centiseconds / 1e7);
    const solved = points + missed;
    const attempted = solved + missed;
    const mm = Math.floor(seconds / 60);
    const ss = String(seconds % 60).padStart(2, "0");
    return `${solved}/${attempted} ${mm}:${ss}`;
  }

  // Regular time (centiseconds → M:SS.cc or SS.cc)
  const cs = centiseconds % 100;
  const totalSeconds = Math.floor(centiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const csStr = String(cs).padStart(2, "0");
  const ssStr = String(seconds).padStart(2, "0");

  if (minutes > 0) {
    return `${minutes}:${ssStr}.${csStr}`;
  }
  return `${seconds}.${csStr}`;
}

/** Formats a date string (YYYY-MM-DD) to a localized Spanish date */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formats a date range for a competition */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  const startDay = startDate.toLocaleDateString("es-UY", { day: "numeric" });
  const endStr = endDate.toLocaleDateString("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (start === end) {
    return formatDate(start);
  }

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDay}–${endStr}`;
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
}
