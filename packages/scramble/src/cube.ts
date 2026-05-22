/**
 * Motor de facelets del cubo 3x3.
 *
 * Las 6 caras se modelan geométricamente: cada pegatina es un cubie (coords en
 * {-1,0,1}) más una normal. Un movimiento rota la capa correspondiente 90°; las
 * permutaciones se derivan de esa rotación, así no hay riesgo de desalinear
 * pegatinas a mano.
 */
import type { CubeState, Face, StickerColor } from "./types";

/** Caras en orden canónico. El índice global de una pegatina es face*9 + local. */
export const FACES = ["U", "R", "F", "D", "L", "B"] as const;
export type FaceKey = (typeof FACES)[number];

type Vec = [number, number, number];

interface Sticker {
  face: FaceKey;
  pos: Vec; // centro del cubie
  normal: Vec; // normal saliente de la pegatina
}

const FACE_NORMAL: Record<FaceKey, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

/**
 * Índice 0-8 de una pegatina dentro de su cara, según el layout del cross-net
 * (fila por fila, de izquierda a derecha, mirando la cara de frente).
 */
function faceLocalIndex(face: FaceKey, [x, y, z]: Vec): number {
  switch (face) {
    case "U": return (z + 1) * 3 + (x + 1);
    case "D": return (1 - z) * 3 + (x + 1);
    case "F": return (1 - y) * 3 + (x + 1);
    case "B": return (1 - y) * 3 + (1 - x);
    case "R": return (1 - y) * 3 + (1 - z);
    case "L": return (1 - y) * 3 + (z + 1);
  }
}

/** Construye las 54 pegatinas con su índice global estable. */
function buildStickers(): Sticker[] {
  const stickers: Sticker[] = new Array(54);
  for (const face of FACES) {
    const normal = FACE_NORMAL[face];
    const axis = normal[0] !== 0 ? 0 : normal[1] !== 0 ? 1 : 2;
    const others = [0, 1, 2].filter((i) => i !== axis);
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const pos: Vec = [0, 0, 0];
        pos[axis] = normal[axis];
        pos[others[0]] = a;
        pos[others[1]] = b;
        const global = FACES.indexOf(face) * 9 + faceLocalIndex(face, pos);
        stickers[global] = { face, pos, normal };
      }
    }
  }
  return stickers;
}

const keyOf = (pos: Vec, normal: Vec): string => `${pos.join(",")}|${normal.join(",")}`;

const STICKERS = buildStickers();
const INDEX_OF = new Map<string, number>(
  STICKERS.map((s, i) => [keyOf(s.pos, s.normal), i]),
);

type Axis = 0 | 1 | 2;

/** Rota un vector 90° alrededor de `axis`. `cw` = horario visto desde el lado +axis. */
function rotate([x, y, z]: Vec, axis: Axis, cw: boolean): Vec {
  if (axis === 0) return cw ? [x, z, -y] : [x, -z, y];
  if (axis === 1) return cw ? [-z, y, x] : [z, y, -x];
  return cw ? [y, -x, z] : [-y, x, z];
}

interface MoveDef {
  axis: Axis;
  layer: number;
  cw: boolean;
}

/** Las 6 caras como giro horario visto desde fuera de esa cara. */
const MOVES: Record<string, MoveDef> = {
  U: { axis: 1, layer: 1, cw: true },
  D: { axis: 1, layer: -1, cw: false },
  R: { axis: 0, layer: 1, cw: true },
  L: { axis: 0, layer: -1, cw: false },
  F: { axis: 2, layer: 1, cw: true },
  B: { axis: 2, layer: -1, cw: false },
};

/** perm[i] = índice destino del color que estaba en la pegatina i. */
function buildPerm(def: MoveDef): number[] {
  const perm = STICKERS.map((_, i) => i);
  STICKERS.forEach((s, i) => {
    if (s.pos[def.axis] !== def.layer) return;
    const dest = INDEX_OF.get(
      keyOf(rotate(s.pos, def.axis, def.cw), rotate(s.normal, def.axis, def.cw)),
    );
    if (dest === undefined) throw new Error("Pegatina sin destino");
    perm[i] = dest;
  });
  return perm;
}

const BASE_PERM: Record<string, number[]> = Object.fromEntries(
  Object.entries(MOVES).map(([m, def]) => [m, buildPerm(def)]),
);

const SOLVED: StickerColor[] = FACES.flatMap(
  (f) => Array(9).fill(f) as StickerColor[],
);

function applyPerm(state: StickerColor[], perm: number[]): StickerColor[] {
  const out = state.slice();
  for (let i = 0; i < 54; i++) out[perm[i]] = state[i];
  return out;
}

function toCubeState(flat: StickerColor[]): CubeState {
  const f = (i: number): Face => flat.slice(i * 9, i * 9 + 9) as Face;
  return { U: f(0), R: f(1), F: f(2), D: f(3), L: f(4), B: f(5) };
}

/** Estado del cubo resuelto. */
export function solvedCube(): CubeState {
  return toCubeState(SOLVED.slice());
}

/**
 * Aplica un scramble en notación WCA (`"R U R' F2 ..."`) al cubo resuelto.
 * Lanza error si encuentra un movimiento inválido.
 */
export function applyScramble(scramble: string): CubeState {
  let state = SOLVED.slice();
  const tokens = scramble.trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const perm = BASE_PERM[token[0]];
    if (!perm) throw new Error(`Movimiento inválido: ${token}`);
    const repeat = token.endsWith("2") ? 2 : token.endsWith("'") ? 3 : 1;
    for (let r = 0; r < repeat; r++) state = applyPerm(state, perm);
  }
  return toCubeState(state);
}
