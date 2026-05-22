/** Mapa de color de pegatina -> color hex. */
import type { StickerColor } from "../types";

/**
 * Color hex de cada pegatina. La clave es la cara que la pegatina ocupa en el
 * cubo resuelto (esquema estándar del cubo: U blanco, D amarillo, etc.).
 */
export const STICKER_HEX: Record<StickerColor, string> = {
  U: "#FFFFFF", // blanco
  R: "#EF4444", // rojo
  F: "#22C55E", // verde
  D: "#FACC15", // amarillo
  L: "#F97316", // naranja
  B: "#1E3A8A", // azul
};
