# @aus/web

Web app de la Asociación Uruguaya de Speedcubing. Next.js 15 + next-auth (WCA OAuth).

## Desarrollo

```bash
npm run dev --workspace apps/web   # desde la raíz del monorepo
# o
cd apps/web && npm run dev
```

Requiere `apps/web/.env.local` con las credenciales de WCA OAuth.

## Scramble del día

La feature "scramble del día" usa el paquete [`@aus/scramble`](../../packages/scramble).
Ver el plan en [`docs/plan`](../../docs/plan).
