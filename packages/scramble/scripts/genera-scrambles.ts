/**
 * Genera scrambles de 3x3 WCA-legales (random-state) con cubing.js y los
 * guarda en `scrambles/<año>.json`. Se corre offline — no es parte del
 * runtime de la web.
 *
 *   # un año entero
 *   npm run gen:scrambles --workspace packages/scramble -- 2027
 *   # una fecha exacta
 *   npm run gen:scrambles --workspace packages/scramble -- 2026-12-31
 *   # regenerar aunque ya exista
 *   npm run gen:scrambles --workspace packages/scramble -- 2026-12-31 --force
 *
 * Sin argumento usa el año actual. Las fechas ya presentes en el JSON no se
 * regeneran salvo que se pase `--force`.
 */
import { randomScrambleForEvent } from "cubing/scramble";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "scrambles");

function fail(msg: string): never {
  console.error(msg);
  console.error("Uso: gen:scrambles <año | YYYY-MM-DD> [--force]");
  process.exit(1);
}

function* daysOfYear(y: number): Generator<string> {
  const d = new Date(Date.UTC(y, 0, 1));
  while (d.getUTCFullYear() === y) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const target =
  args.find((a) => !a.startsWith("--")) ?? String(new Date().getUTCFullYear());

let year: number;
let dates: string[];
if (/^\d{4}$/.test(target)) {
  year = Number(target);
  dates = [...daysOfYear(year)];
} else if (/^\d{4}-\d{2}-\d{2}$/.test(target)) {
  const d = new Date(`${target}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== target) {
    fail(`Fecha inválida: ${target}`);
  }
  year = d.getUTCFullYear();
  dates = [target];
} else {
  fail(`Argumento inválido: ${target}`);
}

const outFile = join(OUT_DIR, `${year}.json`);
const tabla: Record<string, string> = existsSync(outFile)
  ? (JSON.parse(readFileSync(outFile, "utf8")) as Record<string, string>)
  : {};

mkdirSync(OUT_DIR, { recursive: true });

let cambios = 0;
for (const date of dates) {
  if (tabla[date] && !force) continue;
  const previo = tabla[date];
  tabla[date] = (await randomScrambleForEvent("333")).toString();
  cambios++;
  if (dates.length === 1) {
    if (previo) console.log(`  anterior: ${previo}`);
    console.log(`  ${date}: ${tabla[date]}`);
  } else if (cambios % 25 === 0) {
    console.log(`  ${cambios} scrambles generados...`);
  }
}

const ordenado = Object.fromEntries(
  Object.keys(tabla)
    .sort()
    .map((k) => [k, tabla[k]]),
);
writeFileSync(outFile, JSON.stringify(ordenado, null, 1) + "\n");
console.log(
  `${outFile}: ${Object.keys(ordenado).length} scrambles (${cambios} nuevos/regenerados)`,
);
process.exit(0);
