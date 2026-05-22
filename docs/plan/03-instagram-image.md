# 03 · Imagen de Instagram

Generar la imagen vertical para historias de IG (ver `referencia-instagram.png`).

## Formato

- **1080 × 1920 px** (relación 9:16, historia de Instagram).
- Fondo azul AUS con el patrón de cuadrados tenue (como la referencia).
- Contenido, de arriba a abajo:
  1. Pill amarilla con el título: **"SCRAMBLE DIARIO DE 3X3"**.
  2. El scramble en texto grande, blanco, centrado, en una o dos líneas.
  3. La visualización `CubeNet` (cross-net).
  4. Texto de llamada a la acción:
     *"Usá el sticker para contarnos cómo te fue."*
     *"¡Etiquetános para que te compartamos en nuestras historias!"*
  5. Logo de la AUS al pie.

## Cómo se genera

Route en `apps/web` usando `ImageResponse` de `next/og`:

```
apps/web/app/api/scramble/og/route.tsx   →  GET devuelve image/png
```

```tsx
import { ImageResponse } from "next/og";
import { getDailyScramble } from "@aus/scramble";
import { CubeNet } from "@aus/scramble/render";

export const runtime = "edge";

export async function GET() {
  const daily = getDailyScramble();
  return new ImageResponse(
    ( /* JSX de la historia: pill + scramble + <CubeNet/> + textos + logo */ ),
    { width: 1080, height: 1920 }
  );
}
```

### Notas de satori

- Solo flexbox y estilos inline (sin Tailwind, sin `grid`). Por eso `CubeNet`
  ya está pensado con flex inline (etapa 02).
- Las **fuentes** deben cargarse explícitamente (`fonts` en las opciones de
  `ImageResponse`), leyendo los `.ttf`/`.woff` de `apps/web/public/fonts`.
- El patrón de fondo: imagen de fondo o cuadrados en flex.

## Descarga manual (primera entrega)

Sin publicación automática a Instagram. Opciones para bajar la imagen:

- Abrir `/api/scramble/og` en el navegador y "Guardar imagen como…".
- Botón **"Descargar imagen para IG"** en la sección de la web (etapa 04) que
  apunte a esa route con `download`.

## Resultado de la etapa

Pegando `/api/scramble/og` se obtiene el PNG 1080×1920 del día, listo para subir.
