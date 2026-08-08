import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_CONFIG, type LedgerEntry, type PersistedState } from "./types";
import type { WcaRecordsData } from "./types";

/**
 * Persistencia del fondo. Dos backends:
 *
 * - `fs` (por defecto): JSON en `apps/web/data/fondo-records.json`. Anda sin
 *   configurar nada, pero un filesystem efímero (Vercel serverless) pierde las
 *   escrituras entre deploys/instancias.
 * - `postgres`: se activa solo si hay `RECORDS_DATABASE_URL`/`POSTGRES_URL`/
 *   `DATABASE_URL`. Requiere el paquete `pg` instalado.
 *
 * Forzar backend con `RECORDS_STORE=fs|postgres`.
 */

const DATA_FILE =
  process.env.RECORDS_DATA_FILE ??
  path.join(process.cwd(), "data", "fondo-records.json");

const PG_URL =
  process.env.RECORDS_DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  null;

function emptyState(): PersistedState {
  return {
    config: { ...DEFAULT_CONFIG },
    balances: {},
    ledger: [],
    updatedAt: new Date(0).toISOString(),
    seen: {},
    pendingBreaks: [],
  };
}

/**
 * Le pone `id` a los asientos guardados antes de que el campo existiera.
 *
 * Derivado del contenido, nunca aleatorio: `normalize` corre en cada lectura, y
 * un id nuevo por lectura haría que el panel marcara como entregado un asiento
 * distinto del que se ve en pantalla. Tampoco sirve la posición: el ledger se
 * escribe con `unshift`, así que los índices se corren solos.
 */
function conId(entry: LedgerEntry): LedgerEntry {
  if (entry.id) return entry;
  return { ...entry, id: `legacy:${entry.type}:${entry.at}` };
}

/** Completa lo que falte para que un JSON viejo (o a mano) no rompa la app. */
function normalize(raw: unknown): PersistedState {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<PersistedState>;
  return {
    config: { ...base.config, ...(s.config ?? {}) },
    balances: s.balances ?? {},
    ledger: Array.isArray(s.ledger) ? s.ledger.map(conId) : [],
    updatedAt: s.updatedAt ?? base.updatedAt,
    live: s.live,
    seen: s.seen ?? {},
    pendingBreaks: Array.isArray(s.pendingBreaks) ? s.pendingBreaks : [],
    // Sin esta línea el reparto congelado se escribía y se perdía en la lectura
    // siguiente: los porcentajes públicos se recalculaban solos en cada visita.
    distribution: s.distribution,
  };
}

type Mutator<T> = (
  state: PersistedState
) => Promise<{ state: PersistedState; result: T }> | { state: PersistedState; result: T };

interface Backend {
  name: "fs" | "postgres";
  read(): Promise<PersistedState>;
  write(state: PersistedState): Promise<void>;
  /** Read-modify-write atómico. En fs lo garantiza la cola del proceso. */
  mutate<T>(fn: Mutator<T>): Promise<T>;
}

const fsBackend: Backend = {
  name: "fs",
  async read() {
    let raw: string;
    try {
      raw = await fs.readFile(DATA_FILE, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
      throw err;
    }
    try {
      return normalize(JSON.parse(raw));
    } catch (err) {
      // Falla ruidoso a propósito: seguir con un estado vacío escribiría encima
      // de los saldos. Se deja copia para poder recuperarlos a mano.
      const backup = `${DATA_FILE}.corrupto-${Date.now()}`;
      await fs.writeFile(backup, raw, "utf8").catch(() => undefined);
      throw new Error(
        `El estado del fondo (${DATA_FILE}) no es JSON válido: ${(err as Error).message}. ` +
          `Se guardó una copia en ${backup}.`
      );
    }
  },
  async write(state) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    // Escritura atómica: si el proceso muere a mitad, el JSON no queda cortado.
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    const handle = await fs.open(tmp, "w");
    try {
      await handle.writeFile(JSON.stringify(state, null, 2), "utf8");
      // Sin fsync, un corte de energía puede dejar el rename durable con el
      // contenido todavía en el cache del SO.
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(tmp, DATA_FILE);
  },
  async mutate(fn) {
    const current = await this.read();
    const { state, result } = await fn(current);
    await this.write(state);
    return result;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pgPool: any = null;

async function getPool() {
  if (pgPool) return pgPool;
  // Import dinámico con especificador LITERAL: sigue siendo perezoso (quien use
  // el backend `fs` no carga el driver) pero el tracer de Next lo ve y lo mete
  // en el bundle de la lambda. Con el especificador en una variable y
  // `webpackIgnore` no lo rastreaba, y en Vercel `pg` no llegaba al servidor
  // aunque estuviera en package.json: local andaba por el node_modules del disco.
  const pg = await import("pg");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Pool = (pg as any).Pool ?? (pg as any).default?.Pool;
  if (typeof Pool !== "function") {
    throw new Error(
      "El paquete `pg` no expone `Pool`: revisá la versión instalada."
    );
  }
  pgPool = new Pool({
    connectionString: PG_URL,
    // Verificar el certificado: sin esto, quien esté en el camino de red puede
    // leer y reescribir los saldos. `RECORDS_DB_CA` para una CA propia.
    ssl: PG_URL?.includes("localhost")
      ? undefined
      : process.env.RECORDS_DB_CA
        ? { ca: process.env.RECORDS_DB_CA }
        : { rejectUnauthorized: true },
  });
  await pgPool.query(
    `CREATE TABLE IF NOT EXISTS records_fund_state (
       id         int PRIMARY KEY DEFAULT 1,
       data       jsonb NOT NULL,
       updated_at timestamptz NOT NULL DEFAULT now(),
       CONSTRAINT records_fund_state_singleton CHECK (id = 1)
     )`
  );
  return pgPool;
}

const pgBackend: Backend = {
  name: "postgres",
  async read() {
    const pool = await getPool();
    const res = await pool.query("SELECT data FROM records_fund_state WHERE id = 1");
    return normalize(res.rows[0]?.data ?? null);
  },
  /**
   * Read-modify-write dentro de una transacción con `FOR UPDATE` sobre la fila
   * singleton. La cola del proceso solo ordena a los de esta instancia: con dos
   * lambdas escribiendo a la vez, sin esto un reparto entero se perdía.
   */
  async mutate(fn) {
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Asegura la fila para que el lock tenga sobre qué agarrarse.
      await client.query(
        `INSERT INTO records_fund_state (id, data) VALUES (1, '{}'::jsonb)
         ON CONFLICT (id) DO NOTHING`
      );
      const res = await client.query(
        "SELECT data FROM records_fund_state WHERE id = 1 FOR UPDATE"
      );
      const current = normalize(res.rows[0]?.data ?? null);
      const { state, result } = await fn(current);
      await client.query(
        `UPDATE records_fund_state SET data = $1::jsonb, updated_at = now() WHERE id = 1`,
        [JSON.stringify(state)]
      );
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  },
  async write(state) {
    const pool = await getPool();
    await pool.query(
      `INSERT INTO records_fund_state (id, data, updated_at)
       VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [JSON.stringify(state)]
    );
  },
};

function backend(): Backend {
  const forced = process.env.RECORDS_STORE;
  if (forced === "postgres") return pgBackend;
  if (forced === "fs") return fsBackend;
  if (PG_URL) return pgBackend;

  // Sin esto, olvidarse `RECORDS_DATABASE_URL` en Vercel no rompe nada visible:
  // la app arranca, un delegado carga plata, ve el saldo actualizado, y la
  // escritura se pierde cuando recicla la lambda. Un fondo de plata auditable no
  // puede fallar en silencio. `RECORDS_STORE=fs` sigue siendo la salida explícita
  // para quien de verdad quiera disco (un servidor propio con volumen).
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Falta RECORDS_DATABASE_URL. En producción el backend `fs` pierde las " +
        "escrituras (disco efímero). Configurá la base, o poné RECORDS_STORE=fs " +
        "a propósito si el disco de este servidor es persistente."
    );
  }
  return fsBackend;
}

export function storeBackendName(): "fs" | "postgres" {
  return backend().name;
}

export function readState(): Promise<PersistedState> {
  return backend().read();
}

/**
 * Read-modify-write serializado dentro del proceso. Dos delegados apretando
 * "repartir" a la vez no se pisan el saldo (en el mismo proceso; con varias
 * instancias hace falta el backend postgres).
 */
let queue: Promise<unknown> = Promise.resolve();

export function mutateState<T>(fn: Mutator<T>): Promise<T> {
  const run = queue.then(() => backend().mutate(fn));
  // La cola sigue viva aunque una mutación falle.
  queue = run.catch(() => undefined);
  return run;
}

// ── Datos de la WCA (estáticos, generados por wca_datos_full.py) ─────────────

let wcaCache: { data: WcaRecordsData; mtimeMs: number } | null = null;

/**
 * Cachea el export en memoria pero se fija en la fecha del archivo: si se
 * regenera, el proceso vivo servía el viejo hasta reiniciar.
 */
export async function readWcaData(): Promise<WcaRecordsData> {
  const file =
    process.env.RECORDS_WCA_FILE ??
    path.join(process.cwd(), "data", "wca-records.json");
  const { mtimeMs } = await fs.stat(file);
  if (wcaCache && wcaCache.mtimeMs === mtimeMs) return wcaCache.data;
  const raw = await fs.readFile(file, "utf8");
  wcaCache = { data: JSON.parse(raw) as WcaRecordsData, mtimeMs };
  return wcaCache.data;
}
