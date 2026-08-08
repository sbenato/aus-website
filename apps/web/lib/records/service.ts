import { auth } from "@/auth";

import { buildFunds, resolveFunds, totalFund } from "./engine";
import { checkEditor, PAIS, type EditorCheck } from "./permissions";
import { readState, readWcaData, storeBackendName } from "./store";
import type {
  FundConfig,
  LedgerEntry,
  PendingBreak,
  PersistedState,
  RecordFund,
} from "./types";

/** Lo que ve cualquiera: valores de los premios, política vigente y movimientos. */
export interface FundSnapshot {
  pais: string;
  generado: string;
  aviso: string;
  config: FundConfig;
  funds: RecordFund[];
  total: number;
  ledger: LedgerEntry[];
  updatedAt: string;
  /** Cuándo se trajeron WR/SAR/NR de la WCA. null = todavía nunca. */
  recordsFetchedAt: string | null;
  /** Cuándo se calculó el reparto vigente. null = todavía no entró plata. */
  calculatedAt: string | null;
  /** Roturas detectadas por el fetch que esperan que un delegado registre el pago. */
  pendingBreaks: PendingBreak[];
  /** Cuántos asientos tiene el historial completo (se manda solo un tramo). */
  ledgerTotal: number;
}

/** Asientos que viajan al cliente. El historial completo crece sin techo. */
const LEDGER_PAGE = 50;

export async function getSnapshot(limiteLedger = LEDGER_PAGE): Promise<FundSnapshot> {
  const [data, state] = await Promise.all([readWcaData(), readState()]);
  // Lectura barata: el reparto ya está resuelto, solo se le pegan los saldos.
  const funds = resolveFunds(data, state);
  return {
    pais: data.meta.pais,
    generado: data.meta.generado,
    aviso: data.meta.aviso,
    config: state.config,
    funds,
    total: totalFund(funds),
    ledger: state.ledger.slice(0, limiteLedger),
    ledgerTotal: state.ledger.length,
    updatedAt: state.updatedAt,
    recordsFetchedAt:
      state.distribution?.recordsFetchedAt ?? state.live?.fetchedAt ?? null,
    calculatedAt: state.distribution?.at ?? null,
    pendingBreaks: state.pendingBreaks ?? [],
  };
}

/** Los fondos ya resueltos a partir de un estado dado (para las mutaciones). */
export async function fundsFor(state: PersistedState): Promise<RecordFund[]> {
  const data = await readWcaData();
  return resolveFunds(data, state);
}

/** Recalcula desde cero. Solo para cuando entra plata. */
export async function recomputeFunds(state: PersistedState): Promise<RecordFund[]> {
  const data = await readWcaData();
  return buildFunds(data, state);
}

export async function currentEditor(): Promise<EditorCheck> {
  return checkEditor(await auth());
}

/** Guard de escritura: devuelve el editor o una Response 401/403 lista para tirar. */
export async function requireEditor(): Promise<
  { ok: true; editor: EditorCheck } | { ok: false; response: Response }
> {
  const editor = await currentEditor();
  if (editor.canEdit) return { ok: true, editor };
  const status = editor.wcaId || editor.actor !== "anónimo" ? 403 : 401;
  // Mismo texto para "baneado" y "no autorizado": distinguirlos le confirma a
  // alguien que está explícitamente en la banlist.
  const message =
    status === 401
      ? "Iniciá sesión con tu cuenta de la WCA."
      : "Tu cuenta no tiene permiso para editar el fondo.";
  return {
    ok: false,
    response: Response.json({ error: message }, { status }),
  };
}

export { PAIS, storeBackendName };
