import { test } from "node:test";
import assert from "node:assert/strict";
import { applyScramble, solvedCube } from "./cube";
import { generateScramble, getDailyScramble } from "./generate";

const SOLVED = solvedCube();
const eq = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

test("cubo resuelto: cada cara es monocolor", () => {
  for (const [face, stickers] of Object.entries(SOLVED)) {
    assert.ok((stickers as string[]).every((s) => s === face), face);
  }
});

test("scramble vacío deja el cubo resuelto", () => {
  assert.ok(eq(applyScramble(""), SOLVED));
});

test("cada movimiento aplicado 4 veces = identidad", () => {
  for (const m of ["U", "D", "R", "L", "F", "B"]) {
    assert.ok(eq(applyScramble(`${m} ${m} ${m} ${m}`), SOLVED), m);
  }
});

test("M seguido de M' = identidad; M2 M2 = identidad", () => {
  for (const m of ["U", "D", "R", "L", "F", "B"]) {
    assert.ok(eq(applyScramble(`${m} ${m}'`), SOLVED), m);
    assert.ok(eq(applyScramble(`${m}2 ${m}2`), SOLVED), `${m}2`);
  }
});

test("notación equivalente: 'M M M' == \"M'\"", () => {
  for (const m of ["U", "D", "R", "L", "F", "B"]) {
    assert.ok(eq(applyScramble(`${m} ${m} ${m}`), applyScramble(`${m}'`)), m);
  }
});

// Casos direccionales: fijan el sentido físico de cada movimiento.
test("U mueve la fila superior de F hacia L (R -> F)", () => {
  const { F } = applyScramble("U");
  assert.deepEqual([F[0], F[1], F[2]], ["R", "R", "R"]);
});

test("R sube la columna derecha de F a U (F -> U)", () => {
  const { U } = applyScramble("R");
  assert.deepEqual([U[2], U[5], U[8]], ["F", "F", "F"]);
});

test("F lleva la cara U hacia R (U -> R)", () => {
  const { R } = applyScramble("F");
  assert.deepEqual([R[0], R[3], R[6]], ["U", "U", "U"]);
});

test("D mueve la fila inferior de F hacia R (L -> F)", () => {
  const { F } = applyScramble("D");
  assert.deepEqual([F[6], F[7], F[8]], ["L", "L", "L"]);
});

test("sexy move (R U R' U') x6 = identidad", () => {
  assert.ok(eq(applyScramble("R U R' U' ".repeat(6)), SOLVED));
});

test("commutator (R' D R D') x6 = identidad", () => {
  assert.ok(eq(applyScramble("R' D R D' ".repeat(6)), SOLVED));
});

test("movimiento inválido lanza error", () => {
  assert.throws(() => applyScramble("R X U"));
});

test("scramble preserva 9 pegatinas de cada color", () => {
  const { state } = getDailyScramble("2026-05-22");
  const counts: Record<string, number> = {};
  for (const stickers of Object.values(state)) {
    for (const s of stickers) counts[s] = (counts[s] ?? 0) + 1;
  }
  assert.equal(Object.keys(counts).length, 6);
  for (const c of Object.values(counts)) assert.equal(c, 9);
});

test("generateScramble es determinista por fecha", () => {
  assert.equal(generateScramble("2026-05-22"), generateScramble("2026-05-22"));
  assert.notEqual(generateScramble("2026-05-22"), generateScramble("2026-05-23"));
});

test("scramble: 20 movimientos, sin cara repetida consecutiva", () => {
  const moves = generateScramble("2026-05-22").split(" ");
  assert.equal(moves.length, 20);
  for (let i = 1; i < moves.length; i++) {
    assert.notEqual(moves[i][0], moves[i - 1][0]);
  }
});
