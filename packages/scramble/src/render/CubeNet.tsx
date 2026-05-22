/**
 * Visualización del cubo como cross-net (cruz desplegada):
 *
 *           ┌───┐
 *           │ U │
 *       ┌───┼───┼───┬───┐
 *       │ L │ F │ R │ B │
 *       └───┼───┼───┴───┘
 *           │ D │
 *           └───┘
 *
 * Solo flexbox y estilos inline: el mismo JSX se renderiza en la web y en la
 * imagen de Instagram con `ImageResponse`/satori (no soporta `grid` ni clases).
 */
import type { ReactElement } from "react";
import type { CubeState, Face } from "../types";
import { STICKER_HEX } from "./colors";

interface CubeNetProps {
  /** Estado del cubo a pintar. */
  state: CubeState;
  /** Tamaño de cada pegatina en px. Chico para la web, grande para la imagen. */
  cell?: number;
  /** Separación en px entre pegatinas dentro de una cara. */
  gap?: number;
  /** Separación en px entre caras. Por defecto, igual a `gap`. */
  faceGap?: number;
}

/** Una cara: 3 filas de 3 pegatinas, en flex. */
function FaceGrid({
  face,
  cell,
  gap,
}: {
  face: Face;
  cell: number;
  gap: number;
}): ReactElement {
  const radius = Math.max(2, Math.round(cell * 0.12));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {[0, 1, 2].map((row) => (
        <div key={row} style={{ display: "flex", gap }}>
          {[0, 1, 2].map((col) => (
            <div
              key={col}
              style={{
                width: cell,
                height: cell,
                borderRadius: radius,
                backgroundColor: STICKER_HEX[face[row * 3 + col]],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Pinta cualquier `CubeState` como cross-net. Reutilizable en web y en satori. */
export function CubeNet({
  state,
  cell = 28,
  gap = 3,
  faceGap = gap,
}: CubeNetProps): ReactElement {
  // Ancho de una cara: 3 pegatinas + 2 separaciones internas. El espaciador de
  // las filas de U y D usa este ancho para alinear ambas caras sobre F.
  const faceWidth = cell * 3 + gap * 2;
  const spacer = <div style={{ width: faceWidth, flexShrink: 0 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: faceGap }}>
      <div style={{ display: "flex", gap: faceGap }}>
        {spacer}
        <FaceGrid face={state.U} cell={cell} gap={gap} />
      </div>
      <div style={{ display: "flex", gap: faceGap }}>
        <FaceGrid face={state.L} cell={cell} gap={gap} />
        <FaceGrid face={state.F} cell={cell} gap={gap} />
        <FaceGrid face={state.R} cell={cell} gap={gap} />
        <FaceGrid face={state.B} cell={cell} gap={gap} />
      </div>
      <div style={{ display: "flex", gap: faceGap }}>
        {spacer}
        <FaceGrid face={state.D} cell={cell} gap={gap} />
      </div>
    </div>
  );
}
