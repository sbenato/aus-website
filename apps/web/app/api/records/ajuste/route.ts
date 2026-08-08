import { allFundKeys, applyAjuste, resolveFunds, totalFund } from "@/lib/records/engine";
import { requireEditor } from "@/lib/records/service";
import { rateLimit, readJsonBody } from "@/lib/records/guard";
import { mutateState, readWcaData } from "@/lib/records/store";

export const dynamic = "force-dynamic";

/** Solo delegados/admins: corrección manual del saldo de un fondo. Queda en el ledger. */
export async function POST(request: Request) {
  const guard = await requireEditor();
  if (!guard.ok) return guard.response;

  const limited = rateLimit(guard.editor.actor);
  if (limited) return limited;

  const parsedBody = await readJsonBody<{ key?: unknown; fund?: unknown; note?: unknown }>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;

  const key = typeof body.key === "string" ? body.key.slice(0, 40) : "";
  const fundValue = Number(body.fund);
  // Contra la lista real de fondos: `parseFundKey` se conformaba con el sufijo
  // -single/-average y aceptaba claves inventadas de cualquier largo, que se
  // persistían y terminaban servidas en el GET público.
  const data = await readWcaData();
  if (!allFundKeys(data).includes(key)) {
    return Response.json({ error: "Récord desconocido." }, { status: 400 });
  }
  if (!Number.isFinite(fundValue) || fundValue < 0 || fundValue > 1e12) {
    return Response.json(
      { error: "El saldo no puede ser negativo." },
      { status: 400 }
    );
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 300) : undefined;

  const result = await mutateState((state) => {
    const { state: next, entry } = applyAjuste(
      state,
      key,
      fundValue,
      guard.editor.actor,
      note
    );
    return { state: next, result: { next, entry } };
  });

  const funds = resolveFunds(data, result.next);
  return Response.json({
    entry: result.entry,
    funds,
    total: totalFund(funds),
    ledger: result.next.ledger,
    updatedAt: result.next.updatedAt,
  });
}
