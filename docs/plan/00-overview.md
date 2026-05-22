# 00 · Visión general

## Qué queremos

- En la home (o sección propia) se ve el **scramble diario de 3x3** con la
  visualización del estado del cubo (cross-net de colores, igual a la imagen
  de referencia).
- Se puede **descargar una imagen vertical** (formato historia de Instagram)
  con ese scramble, para subirla a mano a `@aus.uy`.
- A futuro, la gente loguea con WCA y **sube su tiempo** del día.

## Arquitectura

Monorepo con npm workspaces:

```
apps/web          Next.js 15 — consume @aus/scramble
packages/scramble Lógica pura: scramble, estado del cubo, render
```

`@aus/scramble` no depende de Next ni del DOM del navegador para su lógica
central; expone tipos y funciones puras. La visualización es un componente
React que se reutiliza tanto en la web como en la generación de la imagen.

### Flujo

```
                 getDailyScramble(fecha)
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
  scramble (string)                  applyScramble()
                                            │
                                            ▼
                                      CubeState (54 stickers)
                                            │
        ┌───────────────────────────────────┴────────────┐
        ▼                                                 ▼
  <CubeNet/> en la web                    /api/scramble/og → PNG vertical
```

## Decisiones clave

### 1. ¿Cómo se genera el scramble diario?

Tiene que ser **WCA-legal** (random-state, no movimientos al azar) y
**determinista**: el mismo día, el mismo scramble para todos.

**Decisión: pre-generar a JSON estático.** Un script offline
(`packages/scramble/scripts/genera-scrambles.ts`) usa `cubing.js`
(`randomScrambleForEvent("333")` — equivalente JS de TNoodle) para generar los
scrambles de todo un año y guardarlos en `packages/scramble/scrambles/<año>.json`.
La web solo **lee** el del día.

Ventajas: scrambles oficiales WCA, sin base de datos, sin dependencia de
`cubing` en runtime, 100% reproducible. `cubing` queda como `devDependency`
(solo el script lo usa).

Respaldo: si una fecha no está en el JSON (ej. un año todavía sin generar),
`getDailyScramble` cae a un generador propio sembrado por fecha — determinista
pero no WCA-legal — para que la web nunca quede sin scramble.

### 2. Estado del cubo

Modelo de facelets propio en `cube.ts` (sin dependencias pesadas): cubo
resuelto + aplicar movimientos `U R F D L B` con modificadores `'` y `2`.
Es código corto y testeable.

### 3. Generación de la imagen

`ImageResponse` de `next/og` (satori) en una API route de `apps/web`. Renderiza
JSX con flexbox a PNG — perfecto para una grilla de cuadrados de colores. No
necesita navegador headless ni `canvas` nativo.

### 4. Persistencia

La fase inicial **no necesita base de datos**: el scramble es determinista y la
imagen se baja a mano. La etapa 05 (subida de resultados) sí la necesita;
la elección de la base se decide en ese documento.

## Fuera de alcance (por ahora)

- Publicación automática en Instagram (la API de IG requiere cuenta business +
  revisión de Meta). Por ahora, descarga manual.
- Eventos distintos al 3x3.
