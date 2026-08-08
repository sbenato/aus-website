/**
 * Motor del Fondo de Récords (§3 reparto, §4 pago de records.md).
 * Funciones puras: no leen sesión, no tocan disco. Se testean solas.
 */

import type {
  FundConfig,
  LedgerEntry,
  LiveRecords,
  PendingBreak,
  PersistedState,
  RecordFund,
  RecordKind,
  WcaEventData,
  WcaRecordsData,
} from "./types";

/** MBLD no tiene media: 17 eventos × 2 − 1 = 33 fondos (§2). */
export const SIN_MEDIA = new Set(["333mbf"]);
/** MBLD se mide en puntos: más es mejor. */
export const INVERTIDOS = new Set(["333mbf"]);

/** Orden de los fondos en la tabla pública: primero los más difíciles. */
export function fundKey(eventId: string, kind: RecordKind): string {
  return `${eventId}-${kind}`;
}

export function parseFundKey(key: string): { eventId: string; kind: RecordKind } | null {
  const i = key.lastIndexOf("-");
  if (i < 0) return null;
  const kind = key.slice(i + 1);
  if (kind !== "single" && kind !== "average") return null;
  return { eventId: key.slice(0, i), kind };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Días desde `nrDate` hasta hoy. El `days` del JSON queda viejo apenas se genera. */
function daysSince(dateStr: string | null, fallback: number, now: Date): number {
  if (!dateStr) return Math.max(fallback, 0);
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return Math.max(fallback, 0);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  return Math.max(days, 0);
}

/** Todas las claves de fondo que existen, en el orden de `data.events`. */
export function allFundKeys(data: WcaRecordsData): string[] {
  const keys: string[] = [];
  for (const eventId of Object.keys(data.events)) {
    keys.push(fundKey(eventId, "single"));
    if (!SIN_MEDIA.has(eventId)) keys.push(fundKey(eventId, "average"));
  }
  return keys;
}

function pick(ev: WcaEventData, kind: RecordKind) {
  const avg = kind === "average";
  return {
    wr: num(avg ? ev.wrAvg : ev.wr),
    nr: num(avg ? ev.nrAvg : ev.nr),
    nrDate: (avg ? ev.nrAvgDate : ev.nrDate) ?? "",
    days: num(avg ? ev.daysAvg : ev.days),
    m0: num(avg ? ev.m0Avg : ev.m0),
    m0Roturas: num(avg ? ev.m0AvgRoturas : ev.m0Roturas),
    sar: num(avg ? ev.sarAvg : ev.sar),
    sarPais: (avg ? ev.sarAvgPais : ev.sarPais) ?? "",
  };
}

/**
 * Arma los 33 fondos y calcula los factores del reparto (§3).
 *
 * WR, NR y SAR salen del fetch en vivo cuando hay (`state.live`); si no, del
 * export. La antigüedad usa `state.seen` — desde cuándo vemos ese valor — porque
 * el `nrDate` del export envejece mal: un récord roto después de generarlo
 * seguiría contando como viejo. El orden de salida es por puntaje.
 */
export function buildFunds(
  data: WcaRecordsData,
  state: PersistedState,
  now: Date = new Date()
): RecordFund[] {
  const config = state.config;
  const funds: RecordFund[] = [];

  for (const [eventId, ev] of Object.entries(data.events)) {
    const kinds: RecordKind[] = SIN_MEDIA.has(eventId)
      ? ["single"]
      : ["single", "average"];
    for (const kind of kinds) {
      const key = fundKey(eventId, kind);
      const p = pick(ev, kind);
      const balance = state.balances[key];
      const live = state.live?.events?.[eventId];
      const avg = kind === "average";

      const liveWr = live ? num(avg ? live.wrAvg : live.wr) : 0;
      const liveNr = live ? num(avg ? live.nrAvg : live.nr) : 0;
      const liveSar = live ? num(avg ? live.sarAvg : live.sar) : 0;
      const usaLive = liveWr > 0 || liveNr > 0;

      const wr = liveWr > 0 ? liveWr : p.wr;
      const nr = liveNr > 0 ? liveNr : p.nr;
      const sar = liveSar > 0 ? liveSar : p.sar;

      // El sudamericano es nuestro si el fetch lo dice o si el export lo nombra.
      const sarIsOurs = live
        ? (avg ? live.sarAvgIsOurs : live.sarIsOurs)
        : !!p.sarPais && p.sarPais === data.meta.pais;

      // Antigüedad: si vimos cambiar el valor, cuenta desde entonces.
      const seen = state.seen?.[key];
      const nrDate =
        seen && nr > 0 && seen.value === nr ? seen.since : p.nrDate;

      funds.push({
        key,
        eventId,
        name: ev.name,
        kind,
        inverted: INVERTIDOS.has(eventId),
        fund: num(balance?.fund),
        bonusPaidBy: balance?.bonusPaidBy ?? [],
        wr,
        nr,
        nrDate,
        days: daysSince(nrDate, p.days, now),
        ppl: num(ev.ppl),
        m0: p.m0 > 0 ? p.m0 : config.m0Fallback,
        m0Roturas: p.m0Roturas,
        sar,
        sarPais: sarIsOurs ? data.meta.pais : p.sarPais,
        sarIsOurs,
        source: usaLive ? "live" : "export",
        dif: 0,
        t: 0,
        n: 0,
        score: 0,
        pct: 0,
      });
    }
  }

  scoreFunds(funds, config);
  funds.sort((a, b) => b.score - a.score);
  return funds;
}

/** Pesos normalizados a suma 1: los sliders quedan independientes entre sí (§3.4). */
export function normalizedWeights(config: FundConfig) {
  const sum = config.alpha + config.beta + config.gamma;
  if (!(sum > 0)) return { alpha: 1 / 3, beta: 1 / 3, gamma: 1 / 3 };
  return {
    alpha: config.alpha / sum,
    beta: config.beta / sum,
    gamma: config.gamma / sum,
  };
}

/** Calcula dif/t/n/score/pct sobre los fondos, in place (§3). */
export function scoreFunds(funds: RecordFund[], config: FundConfig): void {
  const { alpha, beta, gamma } = normalizedWeights(config);
  const tau = config.tau > 0 ? config.tau : 365;
  const maxRoot = Math.max(
    ...funds.map((f) => Math.sqrt(Math.max(f.ppl, 0))),
    1e-9
  );

  for (const f of funds) {
    // §3.1 — dificultad: qué tan cerca está el récord nacional del mundial.
    f.dif =
      f.wr > 0 && f.nr > 0
        ? Math.min(f.inverted ? f.nr / f.wr : f.wr / f.nr, 1)
        : 0;
    // §3.2 — antigüedad saturada: un récord de 6 años no se come el fondo.
    f.t = 1 - Math.exp(-Math.max(f.days, 0) / tau);
    // §3.3 — participación: la raíz comprime para que 3x3 no aplaste a megaminx.
    const np = Math.sqrt(Math.max(f.ppl, 0)) / maxRoot;
    f.n = config.participationDir === "mas" ? np : 1 - np;
    f.score = alpha * f.dif + beta * f.t + gamma * f.n;
  }

  const total = funds.reduce((s, f) => s + f.score, 0) || 1;
  for (const f of funds) f.pct = f.score / total;
}

/**
 * Tope de un aporte, en pesos. Por encima de 1e12 los centavos ya no entran en un
 * float y el redondeo empieza a crear o destruir plata; muy por debajo de eso está
 * cualquier monto que la AUS vaya a manejar.
 */
export const MAX_APORTE = 1e12;

/** Redondeo a centavos que nunca propaga NaN/Infinity a un saldo. */
const round2 = (n: number) => {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
};

/**
 * §3 — reparte `amount` entre los fondos en proporción al puntaje.
 *
 * Trabaja en centavos enteros y reparte el resto por el método del resto mayor:
 * el total cierra exacto (§9) y ninguna asignación puede quedar negativa, cosa
 * que sí pasaba empujando todo el sobrante a un solo fondo (con $0.49 dejaba un
 * fondo en −$0.01).
 */
export function distribute(
  funds: RecordFund[],
  amount: number
): Record<string, number> {
  const allocations: Record<string, number> = {};
  if (funds.length === 0) return allocations;

  const totalCents = Math.round(round2(amount) * 100);
  if (!(totalCents > 0)) {
    for (const f of funds) allocations[f.key] = 0;
    return allocations;
  }

  // Sin puntajes que discriminen, partes iguales: mandarle todo al primero sería
  // arbitrario y es lo que pasaba cuando dif = t = n = 0 en los 33.
  const sumPct = funds.reduce((s, f) => s + (f.pct > 0 ? f.pct : 0), 0);
  const share = (f: RecordFund) =>
    sumPct > 0 ? Math.max(f.pct, 0) / sumPct : 1 / funds.length;

  const exact = funds.map((f) => ({ key: f.key, value: share(f) * totalCents }));
  let assigned = 0;
  for (const e of exact) {
    const floor = Math.floor(e.value);
    allocations[e.key] = floor;
    assigned += floor;
  }

  // Los centavos que sobran van, de a uno, a los de resto más grande.
  const rest = totalCents - assigned;
  if (rest > 0) {
    const orden = exact
      .map((e) => ({ key: e.key, frac: e.value - Math.floor(e.value) }))
      .sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < rest; i++) {
      allocations[orden[i % orden.length].key] += 1;
    }
  }

  for (const key of Object.keys(allocations)) {
    allocations[key] = allocations[key] / 100;
  }
  return allocations;
}

// ── Pago (§4) ────────────────────────────────────────────────────────────────

/** Margen de mejora. MBLD: más puntos es mejor. `null` = no se puede calcular. */
export function margin(
  fund: Pick<RecordFund, "inverted">,
  oldValue: number | null,
  newValue: number | null
): number | null {
  if (!oldValue || oldValue <= 0 || !newValue || newValue <= 0) return null;
  return fund.inverted
    ? (newValue - oldValue) / oldValue
    : (oldValue - newValue) / oldValue;
}

/** §4.2 — curva saturada: f(m) = f_min + (f_max − f_min)·(1 − e^(−m/m₀)). */
export function fCurve(m: number, m0: number, config: FundConfig): number {
  const m0safe = m0 > 0 ? m0 : config.m0Fallback;
  return (
    config.fMin + (config.fMax - config.fMin) * (1 - Math.exp(-m / m0safe))
  );
}

/** Curva invertida: qué margen hace falta para cobrar una fracción `f`. */
export function marginForF(f: number, m0: number, config: FundConfig): number {
  if (f <= config.fMin) return 0;
  if (f >= config.fMax) return Infinity;
  const m0safe = m0 > 0 ? m0 : config.m0Fallback;
  return -m0safe * Math.log(1 - (f - config.fMin) / (config.fMax - config.fMin));
}

/**
 * §4.3 — ¿el nuevo resultado le arrebata el sudamericano a otro país?
 * El bonus es por CAMBIO DE PAÍS, no por tener el récord: si ya es nuestro,
 * bajarlo de nuevo no paga bonus.
 */
export function takesContinental(
  fund: Pick<RecordFund, "sar" | "sarIsOurs" | "inverted">,
  newValue: number
): boolean {
  if (!(fund.sar > 0) || fund.sarIsOurs) return false;
  if (!(newValue > 0)) return false;
  return fund.inverted ? newValue > fund.sar : newValue < fund.sar;
}

export interface PayoutInput {
  fund: RecordFund;
  config: FundConfig;
  /** Récord anterior. Por defecto, el NR que trae el export. */
  oldValue: number | null;
  newValue: number;
  wcaId: string;
  /** Forzar el bonus a mano cuando el export todavía no refleja el SAR. */
  forceContinental?: boolean;
}

export interface PayoutResult {
  m: number | null;
  m0: number;
  f: number;
  bonus: boolean;
  /** Cambia el sudamericano de país con este resultado. */
  continentalFlip: boolean;
  /** El bonus ya lo cobró esta persona en este récord (§4.3, tope por persona). */
  bonusAlreadyPaid: boolean;
  fundBefore: number;
  prize: number;
  fundAfter: number;
  reason: string;
}

/** §4 — cuánto cobra alguien que rompe este récord. No muta nada. */
export function computePayout(input: PayoutInput): PayoutResult {
  const { fund, config, newValue } = input;
  const wcaId = input.wcaId.trim().toUpperCase();
  const oldValue = input.oldValue ?? (fund.nr > 0 ? fund.nr : null);
  const m = margin(fund, oldValue, newValue);
  const m0 = fund.m0 > 0 ? fund.m0 : config.m0Fallback;

  let f: number;
  let reason: string;
  if (m === null) {
    f = config.fMin;
    reason = "sin récord anterior cargado → f_min";
  } else if (m <= 0) {
    f = 0;
    reason = "no mejora el récord: no se paga";
  } else {
    f = fCurve(m, m0, config);
    reason = `curva f(m) con m₀ = ${m0.toFixed(3)}`;
  }

  // §4.3: el flag manual sirve cuando el export todavía no refleja el SAR, pero
  // NO puede saltear la condición de fondo — si el sudamericano ya es uruguayo no
  // hay cambio de país, y pagar ahí es exactamente el bug 1.
  const continentalFlip = fund.sarIsOurs
    ? false
    : !!input.forceContinental || takesContinental(fund, newValue);
  const bonusAlreadyPaid = !!wcaId && fund.bonusPaidBy.includes(wcaId);
  const bonus =
    continentalFlip && !!wcaId && !bonusAlreadyPaid && (m === null || m > 0);
  if (bonus) {
    f = config.fBonus;
    reason = `bonus continental (primera vez de ${wcaId} en ${fund.name})`;
  }

  const fundBefore = round2(fund.fund);
  const prize = round2(fundBefore * f);
  return {
    m,
    m0,
    f,
    bonus,
    continentalFlip,
    bonusAlreadyPaid,
    fundBefore,
    prize,
    fundAfter: round2(fundBefore - prize),
    reason,
  };
}

// ── Mutaciones sobre el estado persistido ────────────────────────────────────

function ensureBalance(state: PersistedState, key: string) {
  if (!state.balances[key]) state.balances[key] = { fund: 0, bonusPaidBy: [] };
  return state.balances[key];
}

/**
 * Guarda los récords traídos de la WCA y detecta qué cambió.
 *
 * Cuando un valor cambia, la antigüedad pasa a contar desde hoy y la rotura queda
 * anotada como pendiente: la plata no se mueve sola, porque el pago necesita el
 * WCA ID de quien la rompió (§4.3, tope por persona) y eso lo carga un delegado.
 */
export function applyRefresh(
  state: PersistedState,
  data: WcaRecordsData,
  live: LiveRecords,
  now: Date = new Date()
): { state: PersistedState; breaks: PendingBreak[] } {
  const next = structuredClone(state);
  const today = now.toISOString().slice(0, 10);
  const previous = buildFunds(data, state, now);
  next.live = live;
  const withLive = buildFunds(data, next, now);

  const seen = { ...(next.seen ?? {}) };
  const breaks: PendingBreak[] = [];

  for (const fund of withLive) {
    if (!(fund.nr > 0)) continue;
    const before = previous.find((f) => f.key === fund.key);
    const known = seen[fund.key];

    if (!known) {
      // Primera vez: confiamos en la fecha del export, no en la de hoy.
      seen[fund.key] = {
        value: fund.nr,
        since: before?.nrDate || fund.nrDate || today,
      };
      continue;
    }
    if (known.value === fund.nr) continue;

    const m = margin(fund, known.value, fund.nr);
    const mejora = m !== null && m > 0;

    // Una corrección de la WCA hacia peor (resultado anulado) NO es una rotura y
    // tampoco puede reiniciar la antigüedad: el récord que queda es más viejo,
    // no más nuevo. Solo se actualiza el valor.
    seen[fund.key] = {
      value: fund.nr,
      since: mejora ? today : known.since,
    };

    if (!mejora) continue;

    // Si esta misma rotura ya está pendiente, no duplicarla (rebote de la WCA:
    // anula y repone el mismo resultado).
    const yaPendiente = (next.pendingBreaks ?? []).some(
      (b) => b.key === fund.key && b.newValue === fund.nr
    );
    // Tampoco es rotura si ese valor ya se pagó: lo dice el ledger.
    const yaPagada = next.ledger.some(
      (e) => e.type === "pago" && e.key === fund.key && e.newValue === fund.nr
    );
    if (yaPendiente || yaPagada) continue;

    breaks.push({
      key: fund.key,
      oldValue: known.value,
      newValue: fund.nr,
      detectedAt: now.toISOString(),
    });
  }

  next.seen = seen;
  next.pendingBreaks = [...(next.pendingBreaks ?? []), ...breaks];
  next.updatedAt = now.toISOString();
  return { state: next, breaks };
}

/**
 * Los 33 fondos para mostrar: el reparto congelado con los saldos de hoy.
 *
 * Los factores (dificultad, antigüedad, participación) y los porcentajes quedan
 * como estaban cuando entró plata por última vez — recalcularlos en cada visita
 * no cambia ningún monto, solo gasta. Los saldos sí se superponen, porque un pago
 * o un ajuste los mueve sin que haya reparto nuevo.
 *
 * Sin reparto previo (fondo recién arrancado) se calculan al vuelo desde el export.
 */
export function resolveFunds(
  data: WcaRecordsData,
  state: PersistedState,
  now: Date = new Date()
): RecordFund[] {
  const frozen = state.distribution?.funds;
  if (!frozen || frozen.length === 0) return buildFunds(data, state, now);

  const out = frozen.map((f) => {
    const balance = state.balances[f.key];
    const seen = state.seen?.[f.key];
    return {
      ...f,
      fund: num(balance?.fund),
      bonusPaidBy: balance?.bonusPaidBy ?? [],
      // El récord y su fecha se congelan, pero los días no: si no, la antigüedad
      // mostraría "5 meses" durante un año.
      days: daysSince(f.nrDate, f.days, now),
      // Un pago posterior al reparto ya actualizó el récord vigente.
      nr: seen && seen.value > 0 ? seen.value : f.nr,
    };
  });

  // Reconciliación: un saldo cuya clave no está en el congelado (evento nuevo, o
  // renombrado en el export) quedaría invisible y fuera del total. Se recupera
  // calculándolo al vuelo en vez de dejar la plata desaparecida.
  const enFoto = new Set(out.map((f) => f.key));
  const huerfanas = Object.keys(state.balances).filter(
    (k) => !enFoto.has(k) && num(state.balances[k]?.fund) !== 0
  );
  if (huerfanas.length > 0) {
    const frescos = buildFunds(data, state, now);
    for (const key of huerfanas) {
      const f = frescos.find((x) => x.key === key);
      if (f) {
        out.push(f);
        continue;
      }
      // Ni en el congelado ni en el export: el evento se renombró o la WCA lo
      // retiró. La plata existe igual, así que se muestra con lo poco que se sabe
      // en vez de evaporarse del total.
      const parsed = parseFundKey(key);
      out.push({
        key,
        eventId: parsed?.eventId ?? key,
        name: parsed?.eventId ?? key,
        kind: parsed?.kind ?? "single",
        inverted: INVERTIDOS.has(parsed?.eventId ?? ""),
        fund: num(state.balances[key]?.fund),
        bonusPaidBy: state.balances[key]?.bonusPaidBy ?? [],
        wr: 0,
        nr: 0,
        nrDate: "",
        days: 0,
        ppl: 0,
        m0: state.config.m0Fallback,
        m0Roturas: 0,
        sar: 0,
        sarPais: "",
        sarIsOurs: false,
        source: "export",
        dif: 0,
        t: 0,
        n: 0,
        score: 0,
        pct: 0,
      });
    }
  }

  return out;
}

/** Congela el reparto vigente: es lo que la página va a mostrar hasta el próximo aporte. */
export function freezeDistribution(
  state: PersistedState,
  funds: RecordFund[],
  now: Date = new Date()
): PersistedState {
  return {
    ...state,
    distribution: {
      at: now.toISOString(),
      config: state.config,
      recordsFetchedAt: state.live?.fetchedAt ?? null,
      // Sin saldos: se superponen al leer, así no quedan dos verdades.
      funds: funds.map((f) => ({ ...f, fund: 0, bonusPaidBy: [] })),
    },
  };
}

/** Aplica un reparto y deja el asiento en el ledger. Devuelve el estado nuevo. */
export function applyReparto(
  state: PersistedState,
  funds: RecordFund[],
  amount: number,
  by: string,
  note?: string,
  requestId?: string | null
): { state: PersistedState; entry: LedgerEntry } {
  const allocations = distribute(funds, amount);
  const next = freezeDistribution(structuredClone(state), funds);
  for (const [key, add] of Object.entries(allocations)) {
    const b = ensureBalance(next, key);
    b.fund = round2(b.fund + add);
  }
  const entry: LedgerEntry = {
    type: "reparto",
    at: new Date().toISOString(),
    by,
    amount: round2(amount),
    allocations,
    config: next.config,
    note,
    requestId: requestId ?? null,
  };
  next.ledger.unshift(entry);
  next.updatedAt = entry.at;
  return { state: next, entry };
}

/** Aplica un pago: descuenta del fondo y anota la trazabilidad del §9. */
export function applyPago(
  state: PersistedState,
  fund: RecordFund,
  payout: PayoutResult,
  input: {
    wcaId: string;
    oldValue: number | null;
    newValue: number;
    by: string;
    note?: string;
    requestId?: string | null;
  }
): { state: PersistedState; entry: LedgerEntry } {
  const wcaId = input.wcaId.trim().toUpperCase();
  const now = new Date();
  const next = structuredClone(state);
  const b = ensureBalance(next, fund.key);
  b.fund = payout.fundAfter;
  if (payout.bonus && !b.bonusPaidBy.includes(wcaId)) b.bonusPaidBy.push(wcaId);

  // El récord acaba de caer: anotarlo acá y no esperar al próximo reparto. Sin
  // esto, un segundo pago del mismo fondo se calcula contra el récord viejo y
  // sobrepaga (medido: +45%). De paso, la antigüedad arranca de cero.
  next.seen = {
    ...(next.seen ?? {}),
    [fund.key]: { value: input.newValue, since: now.toISOString().slice(0, 10) },
  };
  if (next.live?.events) {
    const parsed = parseFundKey(fund.key);
    const ev = parsed ? next.live.events[parsed.eventId] : undefined;
    if (ev && parsed) {
      if (parsed.kind === "average") ev.nrAvg = input.newValue;
      else ev.nr = input.newValue;
    }
  }
  if (next.distribution) {
    const congelado = next.distribution.funds.find((f) => f.key === fund.key);
    if (congelado) {
      congelado.nr = input.newValue;
      congelado.nrDate = now.toISOString().slice(0, 10);
    }
  }

  const entry: LedgerEntry = {
    type: "pago",
    at: new Date().toISOString(),
    by: input.by,
    key: fund.key,
    wcaId,
    oldValue: input.oldValue ?? (fund.nr > 0 ? fund.nr : null),
    newValue: input.newValue,
    m: payout.m,
    m0: payout.m0,
    f: payout.f,
    bonus: payout.bonus,
    fundBefore: payout.fundBefore,
    prize: payout.prize,
    fundAfter: payout.fundAfter,
    reason: payout.reason,
    note: input.note,
    requestId: input.requestId ?? null,
  };
  // Cierra SOLO la rotura que se está pagando. Filtrar por `key` borraba también
  // las otras roturas del mismo fondo, que quedaban sin pagar y sin rastro.
  const pagado = input.newValue;
  let cerrada = false;
  next.pendingBreaks = (next.pendingBreaks ?? []).filter((b) => {
    if (!cerrada && b.key === fund.key && b.newValue === pagado) {
      cerrada = true;
      return false;
    }
    return true;
  });
  next.ledger.unshift(entry);
  next.updatedAt = entry.at;
  return { state: next, entry };
}

/** Corrección manual del saldo de un fondo (errores de carga, aportes dirigidos). */
export function applyAjuste(
  state: PersistedState,
  key: string,
  newFund: number,
  by: string,
  note?: string
): { state: PersistedState; entry: LedgerEntry } {
  const next = structuredClone(state);
  const b = ensureBalance(next, key);
  const before = b.fund;
  b.fund = round2(newFund);
  const entry: LedgerEntry = {
    type: "ajuste",
    at: new Date().toISOString(),
    by,
    key,
    fundBefore: before,
    fundAfter: b.fund,
    note,
  };
  next.ledger.unshift(entry);
  next.updatedAt = entry.at;
  return { state: next, entry };
}

export function totalFund(funds: RecordFund[]): number {
  return round2(funds.reduce((s, f) => s + f.fund, 0));
}
