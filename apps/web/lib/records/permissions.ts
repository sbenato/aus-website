import type { Session } from "next-auth";

/**
 * Quién puede editar las variables del fondo.
 *
 * - Delegados WCA de Uruguay (`delegate_status` no vacío + país UY), automático.
 * - Allowlist manual `AUS_RECORDS_ADMINS` (WCA IDs separados por coma), para la
 *   directiva de la AUS que no es delegada.
 * - Banlist `AUS_RECORDS_BANNED`: gana siempre, incluso sobre un delegado.
 *
 * Los valores de los premios son públicos; esto solo controla la escritura.
 */

function idSet(envValue: string | undefined): Set<string> {
  return new Set(
    (envValue ?? "")
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );
}

/** Acepta WCA IDs (2023CABR01) y también el id interno numérico de la WCA. */
export const ADMIN_IDS = () => idSet(process.env.AUS_RECORDS_ADMINS);
export const BANNED_IDS = () => idSet(process.env.AUS_RECORDS_BANNED);

/** País cuyos récords administra esta instancia. */
export const PAIS = process.env.AUS_RECORDS_COUNTRY ?? "Uruguay";
const PAIS_ISO2 = process.env.AUS_RECORDS_COUNTRY_ISO2 ?? "UY";

export type EditorReason = "delegado" | "admin" | null;

export interface EditorCheck {
  canEdit: boolean;
  reason: EditorReason;
  /** Identidad que queda anotada en el ledger. */
  actor: string;
  wcaId: string | null;
  banned: boolean;
}

export function checkEditor(session: Session | null): EditorCheck {
  const user = session?.user;
  const wcaId = user?.wcaId ? user.wcaId.toUpperCase() : null;
  const internalId =
    typeof user?.wcaInternalId === "number" ? String(user.wcaInternalId) : null;

  // El actor queda publicado en el ledger, que es anónimo: nunca un email.
  const actor = wcaId ?? (internalId ? `WCA#${internalId}` : "anónimo");

  if (!user) {
    return { canEdit: false, reason: null, actor, wcaId, banned: false };
  }

  // La banlist gana sobre cualquier otra vía y se chequea por las dos
  // identidades: un delegado sin WCA ID no puede quedar imbaneable.
  const banned =
    (!!wcaId && BANNED_IDS().has(wcaId)) ||
    (!!internalId && BANNED_IDS().has(internalId));
  if (banned) {
    return { canEdit: false, reason: null, actor, wcaId, banned: true };
  }

  const isDelegate =
    !!user.delegateStatus &&
    !!user.countryIso2 &&
    user.countryIso2.toUpperCase() === PAIS_ISO2.toUpperCase();
  if (isDelegate) {
    return { canEdit: true, reason: "delegado", actor, wcaId, banned: false };
  }

  if (
    (wcaId && ADMIN_IDS().has(wcaId)) ||
    (internalId && ADMIN_IDS().has(internalId))
  ) {
    return { canEdit: true, reason: "admin", actor, wcaId, banned: false };
  }

  return { canEdit: false, reason: null, actor, wcaId, banned: false };
}
