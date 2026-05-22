# @aus/scramble

Motor del **"scramble del día"** de la AUS. Paquete compartido del monorepo: lo
consume `@aus/web` para mostrar la visualización en la página y para generar la
imagen que se sube a Instagram.

## Qué hace

1. **Genera** un scramble diario de 3x3 determinista (mismo día → mismo scramble).
2. **Calcula** el estado del cubo tras aplicar ese scramble (colores de las 54 pegatinas).
3. **Renderiza** la imagen vertical para historias de Instagram (ver imagen de referencia en `docs/plan`).

## API planificada

```ts
import { getDailyScramble, applyScramble, type CubeState } from "@aus/scramble";

const daily = await getDailyScramble();   // scramble + estado del cubo de hoy
const state: CubeState = applyScramble("U D2 F2 R B R2 ...");
```

> Estado: **esqueleto**. Los tipos viven en `src/index.ts`; la implementación se
> hace por etapas según [`docs/plan`](../../docs/plan).

## Estructura prevista

```
packages/scramble/
  src/
    index.ts        API pública
    generate.ts     generación del scramble diario      (etapa 1)
    cube.ts         aplicar scramble -> CubeState        (etapa 2)
    render/         visualización del cubo (cross net)   (etapa 3)
    image.ts        composición de la imagen de IG       (etapa 4)
```

## Desarrollo

```bash
npm run typecheck --workspace packages/scramble
```
