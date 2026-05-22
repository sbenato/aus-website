# 04 · Sección en la web

Mostrar el scramble del día dentro de `apps/web`.

## Dónde

Sección nueva en la home (`app/(site)/page.tsx`) y/o página propia
`app/(site)/scramble/page.tsx`. Recomendado: **sección en la home** + página
propia con más detalle (historial, link a resultados a futuro).

## Componente

`components/scramble/DailyScrambleCard.tsx` (en `apps/web`), que usa
`@aus/scramble`:

```tsx
import { getDailyScramble } from "@aus/scramble";
import { CubeNet } from "@aus/scramble/render";

export function DailyScrambleCard() {
  const daily = getDailyScramble();  // Server Component, se ejecuta en build/req
  // pill "SCRAMBLE DEL DÍA" + scramble + <CubeNet/> + botón descargar imagen
}
```

Contenido de la card:

- Título "Scramble del día" + fecha.
- El scramble en texto grande (monoespaciado, fácil de leer).
- La visualización `CubeNet`.
- Botón **"Descargar imagen para Instagram"** → `/api/scramble/og`.
- Placeholder para "subí tu tiempo" (se activa en la etapa 05).

## Config necesaria en `apps/web`

`@aus/scramble` se distribuye como **TypeScript sin compilar**, así que Next
tiene que transpilarlo:

```ts
// apps/web/next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ["@aus/scramble"],
  // ...resto
};
```

Y agregar la dependencia de workspace:

```jsonc
// apps/web/package.json
"dependencies": {
  "@aus/scramble": "*"
}
```

Después, `npm install` en la raíz enlaza el workspace.

## Estilo

Reusar el branding existente: `gradient-hero`, `brand-navy`, `brand-gold`.
La card en la web puede ser más sobria que la imagen de IG (la imagen es la
versión "vistosa" para redes).

## Resultado de la etapa

El scramble del día visible en la web, con botón para bajar la imagen de IG.
