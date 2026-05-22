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
  | { type: "done" };

/** Paginate through a WCA API competitions list endpoint. */
async function fetchAllPages(url: string): Promise<WCACompWithRoles[]> {
  const all: WCACompWithRoles[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${url}&page=${page}`);
    if (!res.ok) break;
    const data: WCACompWithRoles[] = await res.json();
    all.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return all;
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
        send({
          type: "phase",
          data: `${roleMap.size} competencias con rol encontradas`,
        });

        for (const [id, roles] of roleMap.entries()) {
          const comp = compById.get(id);
          if (!comp || !comp.latitude_degrees || !comp.longitude_degrees)
            continue;

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

        send({ type: "done" });
      } catch (err) {
        console.error("[map/stream]", err);
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
