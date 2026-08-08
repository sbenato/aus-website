import type { LiveEventRecords, LiveRecords } from "./types";

/**
 * Récords en vivo desde la API oficial de la WCA.
 *
 * `records.md` §6 daba esto por imposible ("la API oficial no tiene endpoint de
 * récords"), pero `GET /api/v0/records` existe y devuelve mundiales,
 * continentales y nacionales de todos los países en una sola llamada (~96 KB),
 * sin OAuth. De ahí salen los tres valores que mueven el reparto y el bonus:
 * WR, SAR y NR.
 *
 * Lo que el endpoint NO trae y sigue saliendo del export (`wca-records.json`):
 * fecha del récord, competidores por evento y `m₀` por evento. La fecha se suple
 * anotando desde cuándo vemos cada valor (`seen` en el estado).
 */

const RECORDS_URL =
  process.env.WCA_RECORDS_URL ??
  "https://www.worldcubeassociation.org/api/v0/records";

const COUNTRY = process.env.AUS_RECORDS_COUNTRY ?? "Uruguay";
const CONTINENT = process.env.AUS_RECORDS_CONTINENT ?? "_South America";

type RawRecord = { single?: number; average?: number };
type RawGroup = Record<string, RawRecord>;

interface RawResponse {
  world_records: RawGroup;
  continental_records: Record<string, RawGroup>;
  national_records: Record<string, RawGroup>;
}

/** Eventos donde más es mejor: el valor viene codificado, no es un tiempo. */
const MBLD = "333mbf";
/** Fewest Moves: el single son movimientos crudos; la media viene ×100. */
const FMC = "333fm";

/**
 * Decodifica un valor de la WCA a la unidad que usa el fondo.
 * - tiempos: centésimas → segundos
 * - FMC: single en movimientos, media ×100
 * - MBLD: `(99 − puntos)·1e7 + segundos·100 + fallados` → puntos
 */
export function decodeValue(
  eventId: string,
  kind: "single" | "average",
  raw: number | undefined | null
): number | null {
  if (raw === undefined || raw === null || raw <= 0) return null;
  if (eventId === MBLD) {
    if (kind === "average") return null; // MBLD no tiene media
    return 99 - Math.floor(raw / 1e7);
  }
  if (eventId === FMC) {
    return kind === "single" ? raw : raw / 100;
  }
  return raw / 100;
}

function decodeGroup(
  eventId: string,
  world: RawRecord | undefined,
  continental: RawRecord | undefined,
  national: RawRecord | undefined
): LiveEventRecords {
  const d = (k: "single" | "average", r: RawRecord | undefined) =>
    decodeValue(eventId, k, r?.[k]);

  const sar = d("single", continental);
  const sarAvg = d("average", continental);
  const nr = d("single", national);
  const nrAvg = d("average", national);

  return {
    wr: d("single", world),
    wrAvg: d("average", world),
    nr,
    nrAvg,
    sar,
    sarAvg,
    // Si el continental coincide con el nacional, el sudamericano es nuestro:
    // no hay cambio de país posible y por lo tanto no hay bonus (§4.3).
    sarIsOurs: sar !== null && nr !== null && sar === nr,
    sarAvgIsOurs: sarAvg !== null && nrAvg !== null && sarAvg === nrAvg,
  };
}

export class WcaFetchError extends Error {}

/** Trae y decodifica los récords. Tira `WcaFetchError` si la WCA no responde bien. */
export async function fetchLiveRecords(
  signal?: AbortSignal
): Promise<LiveRecords> {
  let res: Response;
  try {
    res = await fetch(RECORDS_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new WcaFetchError(
      `No se pudo contactar a la WCA: ${(err as Error).message}`
    );
  }
  if (!res.ok) {
    throw new WcaFetchError(`La WCA respondió ${res.status}.`);
  }

  const data = (await res.json()) as RawResponse;
  const world = data.world_records ?? {};
  const continental = data.continental_records?.[CONTINENT] ?? {};
  const national = data.national_records?.[COUNTRY] ?? {};

  if (Object.keys(national).length === 0) {
    throw new WcaFetchError(
      `La WCA no devolvió récords nacionales de ${COUNTRY}.`
    );
  }

  const events: Record<string, LiveEventRecords> = {};
  for (const eventId of Object.keys(world)) {
    events[eventId] = decodeGroup(
      eventId,
      world[eventId],
      continental[eventId],
      national[eventId]
    );
  }

  return { fetchedAt: new Date().toISOString(), events };
}
