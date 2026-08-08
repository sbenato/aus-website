import { applyPago, resolveFunds, computePayout, totalFund } from "@/lib/records/engine";
import { requireEditor } from "@/lib/records/service";
import { rateLimit, readJsonBody } from "@/lib/records/guard";
import { mutateState, readState, readWcaData } from "@/lib/records/store";

export const dynamic = "force-dynamic";

class NotFound extends Error {}

interface PagoBody {
  key?: unknown;
  wcaId?: unknown;
  newValue?: unknown;
  oldValue?: unknown;
  forceContinental?: unknown;
  note?: unknown;
  /** true = solo calcular, sin tocar el fondo. */
  dryRun?: unknown;
  /** Clave de idempotencia contra reintentos. */
  requestId?: unknown;
}

/**
 * Solo delegados/admins: alguien rompió un récord y cobra su fracción (§4).
 * Con `dryRun` devuelve el cálculo sin mover plata.
 */
export async function POST(request: Request) {
  const guard = await requireEditor();
  if (!guard.ok) return guard.response;

  const limited = rateLimit(guard.editor.actor);
  if (limited) return limited;

  const parsedBody = await readJsonBody<PagoBody>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;

  const key = typeof body.key === "string" ? body.key : "";
  const wcaId = typeof body.wcaId === "string" ? body.wcaId.trim().toUpperCase() : "";
  const newValue = Number(body.newValue);
  const oldValue =
    body.oldValue === undefined || body.oldValue === null || body.oldValue === ""
      ? null
      : Number(body.oldValue);
  const dryRun = body.dryRun === true;
  const note = typeof body.note === "string" ? body.note.slice(0, 300) : undefined;
  const requestId =
    typeof body.requestId === "string" ? body.requestId.slice(0, 100) : null;

  if (!key) return Response.json({ error: "Falta el récord." }, { status: 400 });
  if (!/^\d{4}[A-Z]{4}\d{2}$/.test(wcaId)) {
    return Response.json(
      { error: "El WCA ID no tiene el formato 2023CABR01." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(newValue) || newValue <= 0) {
    return Response.json(
      { error: "El resultado nuevo tiene que ser mayor a cero." },
      { status: 400 }
    );
  }
  if (oldValue !== null && (!Number.isFinite(oldValue) || oldValue <= 0)) {
    return Response.json(
      { error: "El récord anterior tiene que ser mayor a cero." },
      { status: 400 }
    );
  }

  const data = await readWcaData();

  if (dryRun) {
    const state = await readState();
    const fund = resolveFunds(data, state).find((f) => f.key === key);
    if (!fund) return Response.json({ error: "Récord desconocido." }, { status: 404 });
    const payout = computePayout({
      fund,
      config: state.config,
      oldValue,
      newValue,
      wcaId,
      forceContinental: body.forceContinental === true,
    });
    return Response.json({ payout, fund, dryRun: true });
  }

  try {
    const result = await mutateState((state) => {
      // Un reintento tras un timeout no puede cobrar dos veces del mismo fondo.
      if (requestId) {
        const yaAplicado = state.ledger.find(
          (e) => e.type === "pago" && e.requestId === requestId
        );
        if (yaAplicado && yaAplicado.type === "pago") {
          return {
            state,
            result: {
              next: state,
              entry: yaAplicado,
              payout: {
                m: yaAplicado.m,
                m0: yaAplicado.m0,
                f: yaAplicado.f,
                bonus: yaAplicado.bonus,
                continentalFlip: yaAplicado.bonus,
                bonusAlreadyPaid: false,
                fundBefore: yaAplicado.fundBefore,
                prize: yaAplicado.prize,
                fundAfter: yaAplicado.fundAfter,
                reason: yaAplicado.reason,
              },
              repetido: true,
            },
          };
        }
      }
      const fund = resolveFunds(data, state).find((f) => f.key === key);
      if (!fund) throw new NotFound("Récord desconocido.");
      const payout = computePayout({
        fund,
        config: state.config,
        oldValue,
        newValue,
        wcaId,
        forceContinental: body.forceContinental === true,
      });
      if (payout.f <= 0) {
        throw new NotFound("El resultado no mejora el récord: no corresponde pago.");
      }
      const { state: next, entry } = applyPago(state, fund, payout, {
        wcaId,
        oldValue,
        newValue,
        by: guard.editor.actor,
        note,
        requestId,
      });
      return { state: next, result: { next, entry, payout, repetido: false } };
    });

    const funds = resolveFunds(data, result.next);
    return Response.json({
      entry: result.entry,
      payout: result.payout,
      repetido: result.repetido,
      pendingBreaks: result.next.pendingBreaks ?? [],
      funds,
      total: totalFund(funds),
      ledger: result.next.ledger,
      updatedAt: result.next.updatedAt,
    });
  } catch (err) {
    if (err instanceof NotFound) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
