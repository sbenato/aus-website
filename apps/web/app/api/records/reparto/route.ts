import {
  applyRefresh,
  applyReparto,
  buildFunds,
  MAX_APORTE,
  resolveFunds,
  totalFund,
} from "@/lib/records/engine";
import { requireEditor } from "@/lib/records/service";
import { rateLimit, readJsonBody } from "@/lib/records/guard";
import { mutateState, readWcaData } from "@/lib/records/store";
import { fetchLiveRecords, WcaFetchError } from "@/lib/records/wca-live";
import type { LiveRecords, PendingBreak } from "@/lib/records/types";

export const dynamic = "force-dynamic";

/**
 * Solo delegados/admins: la AUS mete plata y se reparte entre los 33 fondos (§3).
 *
 * Antes de repartir se traen los récords de la WCA, así la dificultad y la
 * antigüedad reflejan cómo están los récords hoy y no cómo estaban cuando se
 * generó el export. Si la WCA no responde, se reparte igual con lo último
 * guardado y la respuesta lo avisa: no vale bloquear la plata por un fetch.
 */
export async function POST(request: Request) {
  const guard = await requireEditor();
  if (!guard.ok) return guard.response;

  const limited = rateLimit(guard.editor.actor);
  if (limited) return limited;

  const parsedBody = await readJsonBody<{ amount?: unknown; note?: unknown; skipRefresh?: unknown; requestId?: unknown }>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: "El monto a repartir tiene que ser mayor a cero." },
      { status: 400 }
    );
  }
  // Sin tope, un monto absurdo (1e308) desbordaba el redondeo y dejaba saldos en
  // NaN, irrecuperables desde la app.
  if (amount > MAX_APORTE) {
    return Response.json(
      { error: `El monto no puede superar ${MAX_APORTE.toLocaleString("es-UY")}.` },
      { status: 400 }
    );
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 300) : undefined;
  const requestId =
    typeof body.requestId === "string" ? body.requestId.slice(0, 100) : null;

  let live: LiveRecords | null = null;
  let refreshWarning: string | null = null;
  if (body.skipRefresh !== true) {
    try {
      live = await fetchLiveRecords();
    } catch (err) {
      refreshWarning =
        err instanceof WcaFetchError
          ? `${err.message} Se repartió con los récords guardados.`
          : "No se pudieron actualizar los récords; se repartió con los guardados.";
    }
  }

  const data = await readWcaData();
  const result = await mutateState((state) => {
    // Idempotencia: si la conexión se cortó después de aplicar, el reintento del
    // navegador manda el mismo requestId y no se duplica el aporte.
    if (requestId) {
      const yaAplicado = state.ledger.find(
        (e) => e.type === "reparto" && e.requestId === requestId
      );
      if (yaAplicado) {
        return {
          state,
          result: { next: state, entry: yaAplicado, breaks: [], repetido: true },
        };
      }
    }
    let working = state;
    let breaks: PendingBreak[] = [];
    if (live) {
      const refreshed = applyRefresh(working, data, live);
      working = refreshed.state;
      breaks = refreshed.breaks;
    }
    // Único momento en que se rehacen las cuentas: entra plata, se recalcula todo
    // con los récords frescos y el resultado queda congelado hasta el próximo aporte.
    const funds = buildFunds(data, working);
    const { state: next, entry } = applyReparto(
      working,
      funds,
      amount,
      guard.editor.actor,
      note,
      requestId
    );
    return { state: next, result: { next, entry, breaks, repetido: false } };
  });

  const funds = resolveFunds(data, result.next);
  return Response.json({
    entry: result.entry,
    repetido: result.repetido,
    refreshedAt: live?.fetchedAt ?? null,
    refreshWarning,
    breaks: result.breaks,
    pendingBreaks: result.next.pendingBreaks ?? [],
    funds,
    total: totalFund(funds),
    ledger: result.next.ledger,
    updatedAt: result.next.updatedAt,
  });
}
