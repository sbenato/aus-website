import type { Session } from "next-auth";

/**
 * Quién puede editar las variables del fondo. Se piden **las dos** condiciones:
 *
 * 1. Ser delegado de la WCA representando a Uruguay.
 * 2. Estar en `PANEL_WCA_IDS`.
 *
 * La banlist `AUS_RECORDS_BANNED` gana sobre las dos: corta el acceso sin
 * esperar a que la WCA saque el rol.
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

/**
 * Quiénes de la AUS entran al panel del fondo.
 *
 * Es una lista que **restringe**, no que habilita: se cruza con el rol de
 * delegado, así que agregar a alguien acá no le da acceso si la WCA no lo
 * reconoce. Un error en esta lista deja gente afuera, nunca adentro.
 *
 * Va en el código y no en una variable de entorno a propósito: cambiar quién
 * mueve la plata del fondo queda registrado en el historial de git, revisable,
 * en vez de ser un campo que se edita en un dashboard sin dejar rastro (§9).
 *
 * - 2014BENA03 — Sebastiano Benato (presidente AUS)
 * - 2017MONE01 — Gennaro Monetti (tesorero AUS)
 */
const PANEL_WCA_IDS = new Set(["2014BENA03", "2017MONE01"]);

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

  // Las dos condiciones. Un delegado sin WCA ID (solo id interno) tampoco entra:
  // la lista se lleva por WCA ID y no hay con qué compararlo.
  if (isDelegate && wcaId && PANEL_WCA_IDS.has(wcaId)) {
    return { canEdit: true, reason: "delegado", actor, wcaId, banned: false };
  }

  return { canEdit: false, reason: null, actor, wcaId, banned: false };
}
