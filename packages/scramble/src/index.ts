/**
 * @aus/scramble — Motor del "scramble del día".
 *
 * - `getDailyScramble()` → scramble + estado del cubo del día (determinista).
 * - `applyScramble(alg)` → estado del cubo tras aplicar un scramble.
 *
 * Ver el plan en `docs/plan`.
 */
export type { StickerColor, Face, CubeState, DailyScramble } from "./types";
export { FACES, solvedCube, applyScramble } from "./cube";
export { getDailyScramble, generateScramble, todayInMontevideo } from "./generate";
export { lookupScramble, fechasDisponibles } from "./scrambles";
