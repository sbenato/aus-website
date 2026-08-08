import type { NextRequest } from "next/server";

const WCA_BASE = "https://www.worldcubeassociation.org/api/v0";

interface WCACompShort {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  latitude_degrees: number;
  longitude_degrees: number;
}

interface WCACompWithRoles extends WCACompShort {
  delegates: { wca_id: string | null }[];
  organizers: { wca_id: string | null }[];
}

export interface MapCompetition {
  id: string;
  name: string;
  city: string;
  countryIso2: string;
  startDate: string;
  lat: number;
  lng: number;
  delegated: boolean;
  organized: boolean;
}

type StreamMessage =
  | { type: "competition"; data: MapCompetition }
  | { type: "phase"; data: string }
  /** Competencias con rol que la WCA publica sin coordenadas usables. */
  | { type: "done"; withoutLocation?: number }
  | { type: "error"; data: string };

/** Formato de WCA ID: evita que se interpole cualquier cosa en la URL de la WCA. */
const WCA_ID_RE = /^\d{4}[A-Z]{4}\d{2}$/;

/** Tope de páginas por listado: la WCA no debería devolver más, pero por las dudas. */
const MAX_PAGES = 50;

/** Paginate through a WCA API competitions list endpoint. */
async function fetchAllPages(url: string): Promise<WCACompWithRoles[]> {
  const all: WCACompWithRoles[] = [];
  let page = 1;
  while (page <= MAX_PAGES) {
    const res = await fetch(`${url}&page=${page}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) break;
    const data: unknown = await res.json();
    // Una respuesta que no sea lista rompía el spread y mataba el stream entero.
    if (!Array.isArray(data)) break;
    all.push(...(data as WCACompWithRoles[]));
    if (data.length < 100) break;
    page++;
  }
  return all;
}

/** Coordenadas usables. `0,0` es el Golfo de Guinea: la WCA lo usa como "sin dato". */
function hasLocation(c: WCACompShort): boolean {
  const { latitude_degrees: lat, longitude_degrees: lng } = c;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Add 30 days to a YYYY-MM-DD date string. */
function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wca_id: string }> },
) {
  const { wca_id } = await params;

  if (!WCA_ID_RE.test(wca_id)) {
    return Response.json({ error: "WCA ID inválido." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    cancel() {
      cancelled = true;
    },
    async start(controller) {
      function send(msg: StreamMessage) {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));
        } catch {
          cancelled = true;
        }
      }

      try {
        send({ type: "phase", data: "Buscando competencias…" });

        // 1. Get the person's full competition history + delegate-filtered
        //    competitions (catches upcoming assignments where they haven't
        //    competed yet). The "delegate" filter only returns a handful of
        //    recent results but is useful for future competitions.
        const [personRes, delegateComps] = await Promise.all([
          fetch(`${WCA_BASE}/persons/${wca_id}/competitions`),
          fetchAllPages(
            `${WCA_BASE}/competitions?delegate=${wca_id}&start=2003-01-01&per_page=100`,
          ),
        ]);

        if (cancelled) return;

        const personComps: WCACompShort[] = personRes.ok
          ? await personRes.json()
          : [];

        // 2. Merge into a unique set keyed by competition ID.
        const compById = new Map<string, WCACompShort>();
        for (const c of personComps) compById.set(c.id, c);
        for (const c of delegateComps) {
          if (!compById.has(c.id)) compById.set(c.id, c);
        }

        if (compById.size === 0) {
          send({ type: "done" });
          controller.close();
          return;
        }

        // 3. Build roles already known from the delegate-filter response
        //    (those results include delegates[] / organizers[] arrays).
        const roleMap = new Map<
          string,
          { delegated: boolean; organized: boolean }
        >();

        for (const comp of delegateComps) {
          const delegated =
            comp.delegates?.some((d) => d.wca_id === wca_id) ?? false;
          const organized =
            comp.organizers?.some((o) => o.wca_id === wca_id) ?? false;
          if (delegated || organized) {
            roleMap.set(comp.id, { delegated, organized });
          }
        }

        // 4. Group remaining competitions by country + date range so we
        //    can batch-fetch competition lists that include role arrays.
        const countryRanges = new Map<
          string,
          { start: string; end: string }
        >();

        for (const c of compById.values()) {
          if (roleMap.has(c.id)) continue; // role already known
          const existing = countryRanges.get(c.country_iso2);
          if (!existing) {
            countryRanges.set(c.country_iso2, {
              start: c.start_date,
              end: c.start_date,
            });
          } else {
            if (c.start_date < existing.start) existing.start = c.start_date;
            if (c.start_date > existing.end) existing.end = c.start_date;
          }
        }

        send({
          type: "phase",
          data: `${compById.size} competencias en ${countryRanges.size + (delegateComps.length > 0 ? 1 : 0)} fuentes`,
        });

        // 5. For each country, fetch its competition list (includes
        //    delegates/organizers) and cross-reference with our set.
        const needed = new Set(
          [...compById.keys()].filter((id) => !roleMap.has(id)),
        );

        await Promise.all(
          Array.from(countryRanges.entries()).map(
            async ([country, range]) => {
              const comps = await fetchAllPages(
                `${WCA_BASE}/competitions?country_iso2=${country}&start=${range.start}&end=${addDays(range.end, 30)}&per_page=100`,
              );
              for (const comp of comps) {
                if (!needed.has(comp.id)) continue;
                const delegated =
                  comp.delegates?.some((d) => d.wca_id === wca_id) ?? false;
                const organized =
                  comp.organizers?.some((o) => o.wca_id === wca_id) ?? false;
                if (delegated || organized) {
                  roleMap.set(comp.id, { delegated, organized });
                }
                needed.delete(comp.id);
              }
            },
          ),
        );

        if (cancelled) return;

        // 6. Stream the competitions that have a delegate/organizer role.
        //    Se cuentan las dibujables, no las encontradas: antes el mensaje decía
        //    31 y se dibujaban 30, sin explicar la diferencia.
        const conRol = [...roleMap.keys()]
          .map((id) => ({ id, comp: compById.get(id) }))
          .filter((x): x is { id: string; comp: WCACompShort } => !!x.comp);
        const ubicables = conRol.filter((x) => hasLocation(x.comp));
        const sinUbicacion = conRol.length - ubicables.length;

        send({
          type: "phase",
          data:
            `${ubicables.length} competencias con rol` +
            (sinUbicacion > 0 ? ` (${sinUbicacion} sin ubicación)` : ""),
        });

        for (const { id, comp } of ubicables) {
          const roles = roleMap.get(id)!;

          send({
            type: "competition",
            data: {
              id,
              name: comp.name,
              city: comp.city,
              countryIso2: comp.country_iso2,
              startDate: comp.start_date,
              lat: comp.latitude_degrees,
              lng: comp.longitude_degrees,
              delegated: roles.delegated,
              organized: roles.organized,
            },
          });
        }

        send({ type: "done", withoutLocation: sinUbicacion });
      } catch (err) {
        console.error("[map/stream]", err);
        // Sin esto el cliente no podía distinguir "no tiene competencias" de
        // "se rompió", y quedaba cargando para siempre.
        send({
          type: "error",
          data: "No se pudieron cargar las competencias desde la WCA.",
        });
      } finally {
        if (!cancelled) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
