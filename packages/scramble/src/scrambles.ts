/**
 * Acceso a los scrambles WCA-legales pre-generados.
 *
 * Los JSON de la carpeta `scrambles/` se generan offline con cubing.js
 * (ver `scripts/genera-scrambles.ts`). Acá solo se leen — sin dependencias
 * de runtime ni infraestructura.
 */
import scrambles2026 from "../scrambles/2026.json";

/** Tabla fecha (YYYY-MM-DD) -> scramble, de todos los años disponibles. */
const TABLA: Record<string, string> = { ...scrambles2026 };

/** Scramble pre-generado para una fecha, o `undefined` si no hay. */
export function lookupScramble(date: string): string | undefined {
  return TABLA[date];
}

/** Todas las fechas con scramble disponible, ordenadas. */
export function fechasDisponibles(): string[] {
  return Object.keys(TABLA).sort();
}
