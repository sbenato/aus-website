# 05 · Subida de resultados (fase futura)

> Fuera de la primera entrega. Se documenta acá porque condiciona decisiones
> previas (persistencia, scramble oficial).

## Objetivo

La gente loguea con su cuenta de WCA (ya existe el login en la web) y sube su
tiempo para el scramble del día. Se muestra un ranking diario.

## Qué hace falta

### 1. Persistencia

La primera entrega no usa base de datos (scramble determinista). Para guardar
resultados sí hace falta. Opciones a evaluar:

- **Vercel Postgres / Neon** — si la web se despliega en Vercel.
- **Supabase** — Postgres + auth, generoso en free tier.
- **SQLite (Turso/libSQL)** — simple para volumen chico.

Decisión pendiente: depende de dónde se hostea la web hoy.

### 2. Modelo de datos (borrador)

```
daily_scramble        results
─────────────         ─────────────
date (PK)             id (PK)
event                 date (FK)
scramble              wca_id
                      display_name
                      time_ms
                      penalty        (none | +2 | DNF)
                      created_at
```

Una entrada por usuario por día (o quedarse con el mejor intento).

### 3. Endpoints en `apps/web`

- `POST /api/scramble/results` — crear/actualizar el tiempo del usuario logueado.
- `GET /api/scramble/results?date=YYYY-MM-DD` — ranking del día.

Validar la sesión con `auth()` (next-auth ya configurado) — solo usuarios
logueados con WCA pueden subir tiempos.

### 4. UI

- Formulario para cargar el tiempo (input de tiempo + penalización).
- Tabla de ranking del día en la página del scramble.
- Resaltar el resultado propio.

## Impacto en etapas previas

- Si en esta fase queremos **scrambles oficiales WCA** (random-state con
  `cubing`), se generan una vez por día y se guardan en `daily_scramble` al
  pedir el scramble por primera vez. La etapa 01 (opción B) ya lo contempla.

## Anti-trampa (consideración)

El scramble del día es público → la gente puede practicarlo antes. Para un reto
comunitario casual no es grave. Si se quiere algo más serio, habría que pensar
en intentos cronometrados en la propia web (muy fuera de alcance por ahora).
