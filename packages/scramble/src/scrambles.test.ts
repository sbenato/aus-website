import { test } from "node:test";
import assert from "node:assert/strict";
import { applyScramble } from "./cube";
import { fechasDisponibles, lookupScramble } from "./scrambles";
import { getDailyScramble } from "./generate";

test("la tabla cubre el año 2026 completo", () => {
  const dias2026 = fechasDisponibles().filter((d) => d.startsWith("2026-"));
  assert.equal(dias2026.length, 365);
});

test("todos los scrambles pre-generados son aplicables y dejan un cubo válido", () => {
  for (const date of fechasDisponibles()) {
    const scramble = lookupScramble(date);
    assert.ok(scramble, date);
    const state = applyScramble(scramble); // no debe lanzar
    const counts: Record<string, number> = {};
    for (const stickers of Object.values(state)) {
      for (const s of stickers) counts[s] = (counts[s] ?? 0) + 1;
    }
    for (const c of Object.values(counts)) assert.equal(c, 9, date);
  }
});

test("getDailyScramble usa el scramble WCA pre-generado cuando existe", () => {
  assert.equal(
    getDailyScramble("2026-05-22").scramble,
    lookupScramble("2026-05-22"),
  );
});

test("getDailyScramble cae al generador de respaldo si la fecha no está", () => {
  assert.equal(lookupScramble("2099-01-01"), undefined);
  assert.equal(getDailyScramble("2099-01-01").scramble.split(" ").length, 20);
});
