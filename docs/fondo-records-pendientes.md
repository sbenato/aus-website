# Fondo de Récords — pendientes

Estado al **2026-08-08**. El fondo está en producción (`aus-website.vercel.app/records`)
con Postgres, 33 fondos en $0 y el ledger vacío.

Lo que sigue es lo que falta, con el contexto necesario para retomarlo sin
reconstruirlo. Los ítems 1 y 2 del plan original ya están hechos.

---

## 1. Pagar las roturas desde el export (ítem 3)

**Lo que falta:** una función `applyRoturas(state, data, by)` en `lib/records/engine.ts`
que recorra `events[*].roturas[]` del export, saltee las ya pagadas y aplique
`computePayout` + `applyPago` sobre cada una que quede.

Piezas que ya existen y sirven:

| | |
|---|---|
| `roturas[]` en `data/wca-records.json` | 441 roturas, cada una con `fecha`, `wcaId`, `anterior`, `nuevo`, `m` |
| `computePayout` (`engine.ts:327`) | calcula el premio; acepta `oldValue` explícito |
| `applyPago` (`engine.ts:591`) | descuenta del fondo y escribe el asiento |
| `origen: "export" \| "manual"` en `LedgerEntry` | ya está en el tipo, sin usar |

**Orden cronológico.** Cada premio es una fracción del fondo **ya reducido** por el
pago anterior, así que hay que aplicarlas de la más vieja a la más nueva. Entre
fondos distintos el orden no altera los montos (cada uno tiene su saldo y su
`bonusPaidBy`), pero conviene ordenar globalmente igual: deja el ledger legible en
tiempo real.

**Deduplicación.** Una rotura ya pagada se reconoce por `(key, newValue)` en el
ledger. Es la misma convención que ya usa `applyPago` para cerrar `pendingBreaks`.

**Sin titular → no se paga.** Si `wcaId` viene vacío, la rotura queda como
`pendingBreak` con warning visible y la plata no se mueve. Decisión tomada: nunca
mover plata hacia alguien sin nombre. En el export actual las 441 tienen `wcaId`,
así que este camino es defensivo.

### ⚠️ Bloqueante: desde cuándo se paga

**Este es el punto que frenó la implementación y necesita una decisión de la AUS.**

El export trae la historia completa desde 2015. Si `applyRoturas` corre tal cual
sobre un fondo vacío, las 441 roturas se procesan con saldo $0: se registran 441
asientos de premio **$0** y quedan marcadas como pagadas para siempre. Cuando
después entre plata, ninguna de esas personas cobra nunca.

Y si el fondo tuviera plata, el otro extremo: se pagarían de golpe once años de
récords, la mayoría de gente que rompió un récord años antes de que el fondo
existiera.

Hace falta una **fecha de corte**: el fondo solo honra roturas posteriores a X.

Opciones:

- **(a) `roturasDesde` en el estado persistido.** Explícito, auditable, editable
  por un delegado. En la primera corrida se fija a la fecha de ese día y no se paga
  nada histórico.
- **(b) Baseline silencioso.** La primera corrida marca todas las roturas del
  export como vistas sin pagarlas. Más simple, pero la fecha de corte queda
  implícita y no se puede revisar.

Recomendación: **(a)**, y que el valor inicial sea el día en que el fondo abre.

`applyPago` además pisa `seen[key].since` con la fecha de hoy. Para una rotura
histórica eso está mal: haría ver un récord de 2021 como recién puesto, y la
antigüedad es uno de los tres factores del reparto. Hay que pasarle la fecha real
de la rotura.

---

## 2. La API pasa a solo detectar (ítem 4)

Hoy `applyRefresh` (`engine.ts:391`) compara el NR en vivo contra `seen` y encola
`pendingBreaks`. Con el export como fuente de verdad, esa comparación deja de
poder pagar: la API de récords de la WCA **devuelve valores, nunca personas**
(`RawRecord = { single?, average? }`).

Queda como detector: si el NR de hoy difiere del que trae el export, hay una
rotura sin identificar → `pendingBreak` + warning visible del tipo *"hay N roturas
sin titular, regenerá el export"*.

Dos agujeros conocidos de `applyRefresh` que **desaparecen solos** al pasar al
export, y que conviene no re-introducir:

- **Primer refresh ciego** (`engine.ts:411-418`): si no existe `seen[key]`, lo
  inicializa con el valor live —el ya roto— y no emite rotura. Toda rotura entre
  la fecha del export y el primer refresh se tragaba en silencio.
- **Colapso de roturas**: `seen` guarda un solo valor por fondo. Si el mismo
  récord cae dos veces entre refreshes (A→B→C), solo se ve A→C: quien hizo B no
  cobra y quien hizo C cobra de más.

---

## 3. Botón "solo actualizar récords" (ítem 5)

`POST /api/records/refresh`: mismo camino que el reparto pero sin asiento de
aporte. Solo delegados. Es además el blanco natural del cron.

Hoy `applyRefresh` tiene un único llamador: `app/api/records/reparto/route.ts:86`.
Con ~1 reparto por mes, la ventana de detección es de un mes.

---

## 4. Sección pública de récords rotos (ítem 6)

Los datos ya están: los asientos `type: "pago"` traen `key`, `wcaId`, `oldValue`,
`newValue`, `m`, `f`, `prize`. Falta la vista dedicada —evento, viejo → nuevo,
quién, cuánto, entregado sí/no— y resolver `wcaId` → nombre.

---

## 5. Panel: marcar entregado y revertir (ítem 7)

Separar dos cosas que hoy son una:

| | Qué es | Cuándo |
|---|---|---|
| **Pago contable** | baja el saldo del fondo, asiento en el ledger | automático, al detectar la rotura |
| **Entregado** | la AUS efectivamente le dio la plata a la persona | flag manual del delegado |

El tipo ya tiene `entrega?: Entrega \| null` en los asientos `pago`. Falta el
endpoint (`POST /api/records/entrega`) y la sección en el panel. El `id` estable
del ledger, que es lo que permite decir "este pago", ya está hecho.

**Revertir un pago** hace falta sí o sí junto con el pago automático: si el sistema
asigna mal, la plata ya salió. El `ajuste` genérico no alcanza — corrige el saldo
pero no deja rastro de qué pago se anuló.

---

## 6. GitHub Action semanal del export (ítem 8)

Baja el export, corre `tools/wca_datos_full.py`, commitea `data/wca-records.json`.

**La URL del export no es fija.** La vieja
(`/export/results/WCA_export.tsv.zip`) devuelve **410 Gone**. Hay que descubrirla:

```bash
curl -s https://www.worldcubeassociation.org/api/v0/export/public
# → { tsv_url, export_date, export_version, ... }
```

Comparar `export_date` para no reprocesar lo mismo — lo recomienda la propia WCA
en el readme del export. Hoy: v2.0.2, ~370 MB, tarda ~11 s en procesarse.

El script ya tolera v2 (snake_case): `find_col` acepta ambas convenciones y solo
lee `best`/`average`, nunca los `value1-5` que v2 eliminó.

---

## Higiene

- **Rotar la contraseña de Neon en privado.** La actual pasó por el chat. El reset
  está en Neon → proyecto → **Branch → Roles** (no en Settings). Después va a
  Vercel y a `apps/web/.env.local`, con `?sslmode=verify-full` al final.
- **`AUTH_WCA_ID` / `AUTH_WCA_SECRET`** siguen legibles desde el dashboard de
  Vercel. Marcarlas *Sensitive* implica regenerarlas en la WCA.
- **No hay reset del fondo.** Si la prueba con la comunidad ensucia el ledger, hay
  que entrar a Postgres a mano: `ajuste` pone saldos en cero pero no borra
  asientos, y el historial es público por diseño (§9).
- **`records/` sigue fuera de git.** Solo se copiaron al repo
  `tools/wca_datos_full.py` y `docs/records-spec.md`. Los dos HTML y
  `wca_datos.py` (versión vieja, no calcula `m0` ni `sar`) quedaron sueltos en el
  disco, sin historial.

---

## Decisiones de la AUS, no técnicas

Las cuatro del §8 de `records-spec.md`, que definen los porcentajes que la gente ve:

1. Dirección del factor participación (¿más gente = más premio, o menos?)
2. Valores de `f_min` / `f_max` / `τ`
3. Si `m₀` se fija a mano por evento
4. Si se implementa el enfriamiento por persona del §4.4 — la spec pide **no**
   hacerlo salvo pedido expreso

Más la fecha de corte del bloqueante del ítem 1, que es de la misma naturaleza.

---

## Cosas que se descubrieron y conviene no volver a aprender

- **`GET /api/v0/persons?country_iso2=UY` ignora el filtro en silencio.** Devuelve
  el padrón global ordenado por WCA ID: la página 1 de "Uruguay" no trae ningún
  uruguayo. `getUruguayPersons` (`lib/wca-api.ts:64`) hace exactamente esa llamada
  — es código muerto, nadie lo importa, pero es una trampa. `/competitions?country_iso2=UY`
  sí filtra bien (verificado, 25 de 25).
- **`pg` necesita import con especificador literal.** Con la variable +
  `webpackIgnore` el tracer de Next no lo ve y el driver no entra en la lambda:
  en Vercel daba 500 aunque estuviera en `package.json`. En local no se nota.
- **`next dev` confía en localhost, `next start` no.** Sin `AUTH_TRUST_HOST=true`,
  producción responde 500 en `/api/auth/session` con `UntrustedHost`. Todo el
  desarrollo en dev enmascara el bug hasta el deploy.
- **Los overrides de npm no se aplican sobre un `node_modules` existente**, ni
  borrando el lockfile. Hay que borrar `node_modules` también.
- **Sebastiano Benato es `trainee_delegate`**, no `delegate`. Cualquier filtro que
  excluya trainees lo deja afuera del panel.
