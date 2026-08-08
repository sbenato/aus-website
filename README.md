# AUS — Monorepo

Monorepo de la **Asociación Uruguaya de Speedcubing**, gestionado con npm workspaces.

## Proyectos

| Paquete | Carpeta | Descripción |
|---|---|---|
| `@aus/web` | [`apps/web`](apps/web) | Web app pública (Next.js 15 + WCA OAuth). |
| `@aus/scramble` | [`packages/scramble`](packages/scramble) | Motor del "scramble del día": genera scramble, calcula el estado del cubo y la imagen para Instagram. |

## Estructura

```
AUS/
  apps/
    web/            App Next.js (antes en la raíz)
  packages/
    scramble/       Motor de scramble del día (paquete compartido)
  docs/
    plan/           Plan de la feature "scramble del día"
  package.json      Raíz: workspaces + scripts
```

## Features

| Feature | Doc | Estado |
|---|---|---|
| Fondo de Récords Nacionales | [`docs/fondo-records.md`](docs/fondo-records.md) | en producción; pendientes en [`docs/fondo-records-pendientes.md`](docs/fondo-records-pendientes.md) |
| Scramble del día | [`docs/plan`](docs/plan) | en curso |

## Comandos (desde la raíz)

```bash
npm install         # instala todos los workspaces
npm run dev         # levanta apps/web
npm run build       # build de apps/web
npm run lint        # lint de todos los workspaces
```

## Feature en curso: scramble del día

Plan completo en [`docs/plan`](docs/plan). En resumen:

1. La web muestra el **scramble diario de 3x3** con la visualización del cubo.
2. Se genera una **imagen vertical para Instagram** (al principio, subida manual).
3. A futuro, la gente **sube sus resultados** desde la web.
