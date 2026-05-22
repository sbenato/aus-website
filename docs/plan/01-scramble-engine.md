# 01 · Motor de scramble

Paquete: `packages/scramble`. Lógica pura, sin dependencias de Next ni del DOM.

## Objetivo

Dado un día, producir:

```ts
interface DailyScramble {
  date: string;      // "YYYY-MM-DD" en zona America/Montevideo
  event: string;     // "333"
  scramble: string;  // "U D2 F2 R B R2 ..."
  state: CubeState;  // colores de las 54 pegatinas
}
```

## Archivos

```
src/
  index.ts       API pública
  scrambles.ts   lee los scrambles WCA pre-generados (scrambles/<año>.json)
  generate.ts    getDailyScramble: scramble del día + estado del cubo
  cube.ts        aplica el scramble -> CubeState
  rng.ts         PRNG sembrable (generador de respaldo)
scripts/
  genera-scrambles.ts   genera scrambles WCA con cubing.js (offline)
scrambles/
  2026.json      365 scrambles WCA-legales, uno por día
```

> El scramble del día sale del JSON pre-generado (ver decisión 1 en
> [00-overview](00-overview.md)). El generador sembrado (`rng.ts` +
> `generateScramble`) quedó como **respaldo** para fechas sin JSON.

## `rng.ts` — PRNG sembrable

PRNG pequeño y determinista (ej. mulberry32 o xmur3 + sfc32). La semilla sale
de la fecha:

```ts
export function seedFromDate(date: string): number; // hash de "2026-05-22"
export function makeRng(seed: number): () => number; // devuelve [0,1)
```

## `generate.ts` — scramble del día

1. Calcular la fecha de hoy en `America/Montevideo` (`Intl.DateTimeFormat`).
2. Sembrar el RNG con esa fecha.
3. Generar ~20 movimientos para 3x3:
   - Caras: `U D L R F B`. Sufijos: `` `'` `` `2` (vacío = giro horario).
   - **Sin redundancias**: no repetir la misma cara dos veces seguidas, y no
     usar la cara opuesta de la anterior si justo antes ya se usó esa
     (regla estándar de scrambles por movimientos).
4. Devolver el string del scramble.

```ts
export function getDailyScramble(date?: string): DailyScramble;
```

(`date` opcional para poder generar el de un día concreto / testear.)

## `cube.ts` — estado del cubo

Modelo de facelets: 6 caras de 9 pegatinas. Cubo resuelto = cada cara de su
color. Aplicar un movimiento = permutar pegatinas.

- Definir las 6 permutaciones base (`U R F D L B`, giro horario).
- `'` = aplicar 3 veces (o la permutación inversa). `2` = aplicar 2 veces.
- `applyScramble(scramble)` parsea el string y aplica movimiento por movimiento.

```ts
export function applyScramble(scramble: string): CubeState;
```

Orden de pegatinas dentro de cada `Face`: fila por fila, de izquierda a
derecha, mirando la cara de frente.

## Verificación

- Tests: aplicar un movimiento 4 veces = cubo resuelto; `R R' = identidad`;
  scramble conocido → estado conocido.
- `npm run typecheck --workspace packages/scramble`.

## Resultado de la etapa

`getDailyScramble()` devuelve scramble + `CubeState` reproducibles. Listo para
las etapas 02 (visualización) y 03 (imagen).
