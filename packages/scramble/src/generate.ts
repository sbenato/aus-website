/** Scramble diario de 3x3: usa los WCA pre-generados, con generador de respaldo. */
import type { DailyScramble } from "./types";
import { applyScramble } from "./cube";
import { makeRng, seedFromString } from "./rng";
import { lookupScramble } from "./scrambles";

const SCRAMBLE_LENGTH = 20;
const CARAS = ["U", "D", "R", "L", "F", "B"] as const;
const SUFIJOS = ["", "'", "2"] as const;
/** Eje de cada cara: U/D = vertical, R/L = horizontal, F/B = profundidad. */
const EJE: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

/** Fecha de hoy (YYYY-MM-DD) en zona horaria de Uruguay. */
export function todayInMontevideo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
  }).format(new Date());
}

/**
 * Generador de respaldo: scramble de 3x3 determinista por fecha (movimientos
 * aleatorios con semilla). NO es WCA-legal — solo se usa si la fecha no está
 * en los scrambles pre-generados. Sin redundancias: no repite cara consecutiva
 * ni encadena tres movimientos en el mismo eje.
 */
export function generateScramble(date: string): string {
  const rng = makeRng(seedFromString(`333:${date}`));
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

  const moves: string[] = [];
  let prevFace = "";
  let prevAxis = -1;
  let prevPrevAxis = -1;

  while (moves.length < SCRAMBLE_LENGTH) {
    const face = pick(CARAS);
    if (face === prevFace) continue;
    const axis = EJE[face];
    if (axis === prevAxis && axis === prevPrevAxis) continue;

    moves.push(face + pick(SUFIJOS));
    prevPrevAxis = prevAxis;
    prevAxis = axis;
    prevFace = face;
  }
  return moves.join(" ");
}

/**
 * Devuelve el scramble del día con el estado del cubo ya calculado.
 * Usa el scramble WCA pre-generado para esa fecha; si no existe, cae al
 * generador de respaldo. Sin argumento, usa el día actual en Uruguay.
 */
export function getDailyScramble(date: string = todayInMontevideo()): DailyScramble {
  const scramble = lookupScramble(date) ?? generateScramble(date);
  return { date, event: "333", scramble, state: applyScramble(scramble) };
}
