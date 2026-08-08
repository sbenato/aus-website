# Fondo de Récords en la web

Implementación en `apps/web` de la especificación de [`records-spec.md`](records-spec.md).

**Regla de acceso:** los valores de los premios son **públicos** (cualquiera, sin
login, ve saldos, política vigente e historial). Editar es solo para **delegados de
la WCA en Uruguay** y para la **allowlist de administradores de la AUS**, con una
**banlist** que gana sobre las dos vías.

## Piezas

| Archivo | Qué hace |
|---|---|
| `lib/records/types.ts` | Tipos: `FundConfig`, `PersistedState`, `RecordFund`, ledger. |
| `lib/records/engine.ts` | Fórmulas puras: reparto (§3), pago (§4), bonus continental (§4.3). |
| `lib/records/wca-live.ts` | Fetch de WR, SAR y NR a la API oficial de la WCA. |
| `lib/records/store.ts` | Persistencia (JSON en disco o Postgres) + serialización de escrituras. |
| `lib/records/permissions.ts` | Quién puede editar: delegados + allowlist − banlist. |
| `lib/records/service.ts` | Snapshot público y guard de escritura para las rutas. |
| `app/(site)/records/page.tsx` | Página pública. |
| `components/records/*` | Tabla de fondos, calculadora pública, panel de delegados, historial. |
| `data/wca-records.json` | Datos de la WCA (generados, ver abajo). |
| `data/fondo-records.json` | Estado del fondo: saldos, política, ledger. |

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/api/records` | Público — saldos, política, ledger. |
| `POST` | `/api/records/reparto` | Delegado/admin — reparte un aporte entre los 33 fondos. |
| `POST` | `/api/records/pago` | Delegado/admin — registra una rotura y paga. `dryRun: true` solo simula. |
| `PUT` | `/api/records/config` | Delegado/admin — cambia α, β, γ, τ, f_min, f_max, bonus, m₀ por defecto. |
| `POST` | `/api/records/ajuste` | Delegado/admin — corrige el saldo de un fondo a mano. |
| `POST` | `/api/records/refresh` | Delegado/admin — trae WR/SAR/NR de la WCA sin mover plata. |

Sin sesión devuelven 401; con sesión sin permiso, 403. Todo cambio queda en el
ledger firmado con el WCA ID de quien lo hizo, y el ledger es público (§9,
trazabilidad).

## Variables de entorno

```bash
# Permisos
AUS_RECORDS_ADMINS=2015BENA01,2019LEZA01   # allowlist extra (WCA IDs)
AUS_RECORDS_BANNED=2020XXXX01              # banlist: gana sobre delegado y allowlist
AUS_RECORDS_COUNTRY=Uruguay                # país para el bonus continental
AUS_RECORDS_COUNTRY_ISO2=UY                # país que habilita a los delegados

# Persistencia (opcional)
RECORDS_STORE=fs|postgres                  # por defecto: postgres si hay URL, si no fs
RECORDS_DATA_FILE=/ruta/fondo-records.json # por defecto apps/web/data/fondo-records.json
RECORDS_DATABASE_URL=postgres://...        # o POSTGRES_URL / DATABASE_URL
RECORDS_WCA_FILE=/ruta/wca-records.json    # por defecto apps/web/data/wca-records.json

# Fetch en vivo (opcional)
WCA_RECORDS_URL=https://www.worldcubeassociation.org/api/v0/records
AUS_RECORDS_CONTINENT=_South America       # clave del continente en la respuesta
```

### Elegir backend

- **`fs` (por defecto)**: JSON en disco. No requiere configurar nada y anda en
  local o en un hosting con disco propio (VPS, Docker, Fly).
- **`postgres`**: obligatorio en **Vercel u otro serverless**, donde el filesystem
  es efímero y cada instancia tiene el suyo — las escrituras se perderían. Setear
  `RECORDS_DATABASE_URL` e instalar el driver:

  ```bash
  npm i pg --workspace apps/web
  ```

  La tabla (`records_fund_state`, una sola fila con el estado en `jsonb`) se crea
  sola en el primer uso.

Con varias instancias, el candado de escritura de `store.ts` es por proceso: ahí el
backend postgres no es opcional.

## De dónde salen los récords

Dos fuentes, y conviene tener claro qué aporta cada una.

### 1. En vivo — `GET /api/v0/records` de la WCA

`records.md` §6 daba esto por imposible ("la API oficial no tiene endpoint de
récords"). **Hoy sí existe**: una sola llamada sin OAuth (~96 KB) devuelve récords
mundiales, continentales y nacionales de los 166 países. De ahí salen **WR, SAR y
NR**, o sea los tres valores que mueven la dificultad y el bonus continental.

Se refresca **automáticamente al repartir un aporte** (así la dificultad refleja
cómo están los récords hoy, no cómo estaban al generar el export) y a mano con el
botón *Actualizar récords*. Si la WCA no responde, el reparto **igual se hace** con
lo último guardado y la respuesta lo avisa: no se bloquea la plata por un fetch.

Dos cosas que el fetch resuelve de paso:

- **Antigüedad viva.** Cuando un valor cambia, se anota desde cuándo lo vemos
  (`seen` en el estado) y el factor antigüedad arranca de cero. Sin esto, un récord
  roto después de generar el export seguiría cobrando como récord viejo.
- **Roturas detectadas.** Si el NR mejoró, queda una alerta en el panel con el valor
  viejo y el nuevo. **La plata no sale sola**: el pago necesita el WCA ID de quien lo
  rompió, porque el bonus continental se paga una vez por persona (§4.3). El delegado
  la registra con un clic y la alerta se cierra.
- **`sarIsOurs` derivado.** El endpoint no dice de qué país es el sudamericano, pero
  si el SAR coincide con el NR uruguayo, es nuestro — que es exactamente la condición
  del §4.3 (el bonus es por cambio de país).

### 2. Export oficial — `tools/wca_datos_full.py`

Lo que la API **no** trae y sigue saliendo del export: **competidores por evento**
(factor participación), **`m₀` por evento** (mediana histórica de mejoras), el
histórico continental y **quién rompió cada récord** (`roturas[]`) — la API de
récords devuelve valores, nunca personas.

La URL del export **no es fija**: hay que descubrirla por la API, que además trae
`export_date` para saber si hay uno nuevo.

```bash
# 1. Descubrir y bajar el export vigente (~370 MB)
URL=$(curl -s https://www.worldcubeassociation.org/api/v0/export/public \
      | python3 -c 'import sys,json; print(json.load(sys.stdin)["tsv_url"])')
curl -sL -o wca-export.zip "$URL"

# 2. Generar (tarda ~11 s)
python3 tools/wca_datos_full.py --zip wca-export.zip \
        --country Uruguay --months 24 --out apps/web/data/wca-records.json
```

El script nunca toca plata: solo lee el export y escribe el JSON.

**Cuándo correrlo:** los saldos no dependen de esto, pero los **pagos sí** — las
roturas con nombre salen de acá. Un récord roto no se puede pagar hasta que el
export lo refleje. El endpoint en vivo detecta que algo cambió y avisa, pero no
sabe a quién pagarle.

## Lo que la página muestra sin login

- Saldo de cada uno de los 33 fondos, con su porcentaje del reparto.
- Récord uruguayo, mundial y sudamericano de cada categoría, y los tres factores
  (dificultad, antigüedad, participación) que explican el reparto.
- Calculadora: "si bajo el récord a X, cobro Y", más la tabla de ejemplos del §9 y
  la consulta inversa ("quiero cobrar $5.000, ¿qué mejora necesito?").
- Historial completo de aportes, pagos y cambios de política.

## Pendiente (decisiones abiertas del §8 de `records.md`)

Todas las que dependen de números ya son editables desde el panel (dirección de la
participación, `f_min`/`f_max`, `τ`, `m₀` por defecto). Quedan sin implementar, a
propósito: `m₀` fijado a mano por evento (hoy sale del histórico) y el enfriamiento
por persona del §4.4, que la especificación pide no implementar salvo pedido
expreso de la AUS.
