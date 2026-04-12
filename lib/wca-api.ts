import type { WCACompetition, WCAPerson, WCAUser } from "./types";

const WCA_BASE = "https://www.worldcubeassociation.org/api/v0";

async function wcaFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${WCA_BASE}${path}`, {
    next: { revalidate: 300 }, // cache for 5 minutes
    ...options,
  });

  if (!res.ok) {
    throw new Error(`WCA API error: ${res.status} ${res.statusText} (${path})`);
  }

  return res.json() as Promise<T>;
}

// ── Competitions ──────────────────────────────────────────────────────────────

export async function getUruguayCompetitions(params?: {
  upcoming?: boolean;
  past?: boolean;
  page?: number;
  perPage?: number;
}): Promise<WCACompetition[]> {
  const query = new URLSearchParams();
  query.set("country_iso2", "UY");
  query.set("per_page", String(params?.perPage ?? 25));
  query.set("page", String(params?.page ?? 1));

  const today = new Date().toISOString().split("T")[0];

  if (params?.upcoming) {
    query.set("start", today);
    query.set("sort", "start_date");
  } else if (params?.past) {
    query.set("end", today);
    query.set("sort", "-start_date");
  } else {
    query.set("sort", "-start_date");
  }

  return wcaFetch<WCACompetition[]>(`/competitions?${query}`);
}

export async function getUpcomingUruguayCompetitions(
  limit = 3
): Promise<WCACompetition[]> {
  const comps = await getUruguayCompetitions({ upcoming: true, perPage: limit });
  return comps.slice(0, limit);
}

export async function getCompetitionById(
  id: string
): Promise<WCACompetition> {
  return wcaFetch<WCACompetition>(`/competitions/${id}`);
}

// ── Members / Persons ─────────────────────────────────────────────────────────

export async function getUruguayPersons(page = 1): Promise<WCAPerson[]> {
  return wcaFetch<WCAPerson[]>(
    `/persons?country_iso2=UY&page=${page}&per_page=24`
  );
}

export async function getPersonByWcaId(wcaId: string): Promise<WCAPerson> {
  return wcaFetch<WCAPerson>(`/persons/${wcaId}`);
}

// ── Authenticated endpoints ───────────────────────────────────────────────────

export async function getAuthenticatedUser(
  accessToken: string
): Promise<WCAUser> {
  const data = await fetch(`${WCA_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!data.ok) {
    throw new Error("Failed to fetch authenticated user");
  }

  const json = (await data.json()) as { me: WCAUser };
  return json.me;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCompetitionStatus(comp: WCACompetition) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (comp.cancelled_at) return "cancelled" as const;
  if (comp.end_date < today) return "past" as const;
  if (comp.start_date <= today && today <= comp.end_date) return "in_progress" as const;

  if (comp.registration_open && comp.registration_close) {
    const regOpen = new Date(comp.registration_open);
    const regClose = new Date(comp.registration_close);
    if (now >= regOpen && now <= regClose) return "registration_open" as const;
  }

  return "upcoming" as const;
}
