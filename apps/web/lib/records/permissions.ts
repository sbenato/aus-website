import type { Session } from "next-auth";

/**
 * Quién puede editar las variables del fondo.
 *
 * **Solo delegados de la WCA que representan a Uruguay.** No hay allowlist: la
 * autoridad para mover plata del fondo se deriva de un rol que otorga y revoca
 * la WCA, no de una variable de entorno que se puede editar sin dejar rastro.
 *
 * La banlist `AUS_RECORDS_BANNED` sigue existiendo y gana sobre todo: sirve para
 * cortarle el acceso a alguien sin esperar a que la WCA le saque el rol.
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
export const BANNED_IDS = () => idSet(process.env.AUS_RECORDS_BANNED);

/** País cuyos récords administra esta instancia. */
export const PAIS = process.env.AUS_RECORDS_COUNTRY ?? "Uruguay";
const PAIS_ISO2 = process.env.AUS_RECORDS_COUNTRY_ISO2 ?? "UY";

export type EditorReason = "delegado" | null;

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

  return { canEdit: false, reason: null, actor, wcaId, banned: false };
}
