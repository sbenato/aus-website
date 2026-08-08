import { fundsFor, requireEditor } from "@/lib/records/service";
import { rateLimit, readJsonBody } from "@/lib/records/guard";
import { mutateState } from "@/lib/records/store";
import type { FundConfig, LedgerEntry } from "@/lib/records/types";
import { totalFund } from "@/lib/records/engine";

export const dynamic = "force-dynamic";

class BadRequest extends Error {}

type NumericKey = Exclude<keyof FundConfig, "participationDir">;

/** Rangos que evitan configuraciones que rompen las fórmulas (§3, §4). */
const LIMITS: Record<NumericKey, [number, number]> = {
  alpha: [0, 1],
  beta: [0, 1],
  gamma: [0, 1],
  tau: [1, 5000],
  fMin: [0.01, 1],
  fMax: [0.01, 1],
  fBonus: [0.01, 1],
  m0Fallback: [0.001, 1],
};

function validate(
  raw: Record<string, unknown>,
  current: FundConfig
): { config: FundConfig } | { error: string } {
  const next: FundConfig = { ...current };

  for (const key of Object.keys(LIMITS) as NumericKey[]) {
    if (raw[key] === undefined) continue;
    const value = Number(raw[key]);
    const [min, max] = LIMITS[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      return { error: `${key} tiene que ser un número entre ${min} y ${max}.` };
    }
    next[key] = value;
  }

  if (raw.participationDir !== undefined) {
    if (raw.participationDir !== "mas" && raw.participationDir !== "menos") {
      return { error: 'participationDir tiene que ser "mas" o "menos".' };
    }
    next.participationDir = raw.participationDir;
  }

  if (next.alpha + next.beta + next.gamma <= 0) {
    return { error: "Los pesos α, β y γ no pueden sumar cero." };
  }
  if (next.fMax < next.fMin) {
    return { error: "f_max no puede ser menor que f_min." };
  }
  if (next.fBonus < next.fMax) {
    return {
      error:
        "El bonus continental no puede pagar menos que f_max: dejaría de ser un bonus.",
    };
  }
  return { config: next };
}

/** Solo delegados/admins: cambia la política del fondo. */
export async function PUT(request: Request) {
  const guard = await requireEditor();
  if (!guard.ok) return guard.response;

  const limited = rateLimit(guard.editor.actor);
  if (limited) return limited;

  const parsedBody = await readJsonBody<Record<string, unknown>>(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;

  try {
    const result = await mutateState((state) => {
      const validated = validate(body, state.config);
      if ("error" in validated) throw new BadRequest(validated.error);

      const entry: LedgerEntry = {
        type: "config",
        at: new Date().toISOString(),
        by: guard.editor.actor,
        before: state.config,
        after: validated.config,
      };
      const next = {
        ...state,
        config: validated.config,
        ledger: [entry, ...state.ledger],
        updatedAt: entry.at,
      };
      return { state: next, result: next };
    });

    // El reparto vigente no se toca: la política nueva rige desde el próximo aporte.
    const funds = await fundsFor(result);
    return Response.json({
      config: result.config,
      funds,
      total: totalFund(funds),
      ledger: result.ledger,
      updatedAt: result.updatedAt,
    });
  } catch (err) {
    if (err instanceof BadRequest) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
