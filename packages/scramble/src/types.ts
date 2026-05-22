/** Tipos públicos del motor de scramble. */

/** Color de una pegatina del cubo = la cara que ocupa en el cubo resuelto. */
export type StickerColor = "U" | "R" | "F" | "D" | "L" | "B";

/** Cara 3x3: 9 pegatinas en orden de lectura (fila por fila, de izquierda a derecha). */
export type Face = [
  StickerColor, StickerColor, StickerColor,
  StickerColor, StickerColor, StickerColor,
  StickerColor, StickerColor, StickerColor,
];

/** Estado completo del cubo: las 6 caras. */
export interface CubeState {
  U: Face;
  R: Face;
  F: Face;
  D: Face;
  L: Face;
  B: Face;
}

/** Scramble del día con todo lo necesario para mostrarlo. */
export interface DailyScramble {
  /** Fecha en formato YYYY-MM-DD (zona America/Montevideo). */
  date: string;
  /** Evento WCA, ej. "333". */
  event: string;
  /** Algoritmo del scramble en notación WCA. */
  scramble: string;
  /** Estado del cubo tras aplicar el scramble. */
  state: CubeState;
}
