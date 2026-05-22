# 02 · Visualización del cubo

El componente que dibuja el estado del cubo como **cross-net** (cruz desplegada):
la cara U arriba, la fila `L F R B` en el medio, la cara D abajo.

```
        ┌───┐
        │ U │
    ┌───┼───┼───┬───┐
    │ L │ F │ R │ B │
    └───┼───┼───┴───┘
        │ D │
        └───┘
```

## Dónde vive

En `packages/scramble`, como componente React reutilizable:

```
src/render/
  CubeNet.tsx     componente del cross-net
  colors.ts       mapa StickerColor -> color hex
```

Se reutiliza en dos lugares:

- **Web** (etapa 04): se muestra en la página.
- **Imagen de IG** (etapa 03): el mismo JSX lo renderiza `ImageResponse`.

> Importante: `ImageResponse`/satori solo soporta un subconjunto de CSS
> (flexbox, sin `grid`, sin clases de Tailwind). El componente debe usar
> **estilos inline con flexbox** para funcionar igual en web y en la imagen.

## `colors.ts`

```ts
export const STICKER_HEX: Record<StickerColor, string> = {
  U: "#FFFFFF", // blanco
  R: "#EF4444", // rojo
  F: "#22C55E", // verde
  D: "#FACC15", // amarillo
  L: "#F97316", // naranja
  B: "#1E3A8A", // azul
};
```

(Ajustar los hex al esquema de colores estándar del cubo / branding AUS.)

## `CubeNet.tsx`

```tsx
export function CubeNet({
  state,
  cell = 28,   // tamaño de cada pegatina en px
  gap = 3,
}: {
  state: CubeState;
  cell?: number;
  gap?: number;
}): JSX.Element;
```

- Cada cara: contenedor flex con 3 filas de 3 cuadrados.
- Cuadrados: `borderRadius` chico, color de `STICKER_HEX`.
- Layout cross: filas flex; arriba U centrada, medio `L F R B`, abajo D centrada.
- `cell` parametrizable: chico para la web, grande para la imagen 1080px.

## Verificación

Renderizar `CubeNet` con un `CubeState` resuelto (cada cara monocolor) y con uno
scrambleado; comparar visualmente con la imagen de referencia.

## Resultado de la etapa

Componente `CubeNet` que pinta cualquier `CubeState`, usable en web y en satori.
