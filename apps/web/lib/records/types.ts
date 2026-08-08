/**
 * Fondo de Récords Nacionales — tipos.
 * Especificación: docs/records-spec.md.
 */

export type RecordKind = "single" | "average";

/** Un evento tal como lo escribe `wca_datos_full.py` en `data/wca-records.json`. */
export interface WcaEventData {
  name: string;
  wr: number | null;
  nr: number | null;
  wrAvg: number | null;
  nrAvg: number | null;
  nrDate: string | null;
  nrAvgDate: string | null;
  days: number | null;
  daysAvg: number | null;
  ppl: number | null;
  pplAllTime: number | null;
  m0: number | null;
  m0Roturas: number | null;
  m0Fallback: boolean;
  m0Avg: number | null;
  m0AvgRoturas: number | null;
  m0AvgFallback: boolean;
  sar: number | null;
  sarPais: string | null;
  sarWcaId: string | null;
  sarAvg: number | null;
  sarAvgPais: string | null;
  sarEsNuestro: boolean;
  /** Cada vez que cayó el NR single, con quién lo rompió (§4). Fuente de verdad
   *  para pagar: la API de récords de la WCA da valores, no personas. */
  roturas?: RoturaExport[];
  /** Lo mismo para la media. Vacío en los eventos sin media. */
  roturasAvg?: RoturaExport[];
  lowerIsBetter: boolean;
  note: string | null;
}

/** Una rotura del récord nacional, tal como la emite `wca_datos_full.py`. */
export interface RoturaExport {
  /** Fecha de la competencia, `YYYY-MM-DD`. */
  fecha: string;
  /** Quién la rompió. Siempre presente: sale del `personId` del export. */
  wcaId: string;
  /** El récord que había antes. */
  anterior: number;
  /** El récord nuevo. */
  nuevo: number;
  /** Margen relativo de mejora (§4.2), redondeado a 6 decimales. */
  m: number;
}

export interface WcaRecordsData {
  meta: {
    fuente: string;
    pais: string;
    continente: string;
    ventana_meses: number;
    generado: string;
    m0_fallback: number;
    m0_min_roturas: number;
    aviso: string;
  };
  events: Record<string, WcaEventData>;
}

/** Política de la AUS. Editable solo por delegados/admins. */
export interface FundConfig {
  /** Peso del factor dificultad (§3.1). Se normaliza junto con beta y gamma. */
  alpha: number;
  /** Peso del factor antigüedad (§3.2). */
  beta: number;
  /** Peso del factor participación (§3.3). */
  gamma: number;
  /** Constante de saturación de la antigüedad, en días (§3.2). */
  tau: number;
  /** Dirección del factor participación (§3.3): más gente = más premio, o menos. */
  participationDir: "mas" | "menos";
  /** Fracción mínima que se paga al romper un récord (§4.2). Nunca 0. */
  fMin: number;
  /** Fracción máxima por margen (§4.2). */
  fMax: number;
  /** Fracción con bonus continental (§4.3). */
  fBonus: number;
  /** m₀ cuando el evento no tiene histórico suficiente (§4.2). */
  m0Fallback: number;
}

/** Lo mutable de cada fondo. Lo estático sale de `wca-records.json`. */
export interface FundBalance {
  /** Plata acumulada, en pesos. */
  fund: number;
  /** WCA IDs que ya cobraron el bonus continental de este récord (§4.3). */
  bonusPaidBy: string[];
}

/**
 * Lo que comparte todo asiento. `id` es la referencia estable de un movimiento:
 * antes la UI los indexaba por posición (`${at}-${i}`), que se corre solo con
 * que entre un asiento nuevo — el ledger se escribe con `unshift`.
 */
interface LedgerBase {
  /** Estable e irrepetible. Con qué el panel dice "este pago", no "el tercero". */
  id: string;
  at: string;
  by: string;
}

/** Entrega real de la plata a la persona. Es distinto del pago contable: el
 *  saldo del fondo baja al detectarse la rotura, la transferencia ocurre después
 *  y la marca un delegado a mano. */
export interface Entrega {
  at: string;
  /** Quién la marcó. */
  by: string;
  note?: string;
}

export type LedgerEntry =
  | (LedgerBase & {
      type: "reparto";
      amount: number;
      /** key del fondo → plata que le tocó */
      allocations: Record<string, number>;
      config: FundConfig;
      note?: string;
      /** Clave de idempotencia: evita duplicar el aporte si se reintenta. */
      requestId?: string | null;
    })
  | (LedgerBase & {
      type: "pago";
      key: string;
      wcaId: string;
      oldValue: number | null;
      newValue: number;
      /** margen de mejora calculado (§4.2) */
      m: number | null;
      m0: number;
      f: number;
      bonus: boolean;
      fundBefore: number;
      prize: number;
      fundAfter: number;
      reason: string;
      note?: string;
      /** Clave de idempotencia: evita duplicar el pago si se reintenta. */
      requestId?: string | null;
      /** null = calculado y descontado del fondo, pero todavía no entregado. */
      entrega?: Entrega | null;
      /** Cómo se identificó a la persona. `export` = del historial oficial;
       *  `manual` = la cargó un delegado. */
      origen?: "export" | "manual";
    })
  | (LedgerBase & {
      type: "config";
      before: FundConfig;
      after: FundConfig;
    })
  | (LedgerBase & {
      type: "ajuste";
      key: string;
      fundBefore: number;
      fundAfter: number;
      note?: string;
    });

/** Récords de un evento tal como los devuelve la API oficial, ya decodificados. */
export interface LiveEventRecords {
  wr: number | null;
  wrAvg: number | null;
  nr: number | null;
  nrAvg: number | null;
  sar: number | null;
  sarAvg: number | null;
  /** El sudamericano lo tiene Uruguay: se deriva de que SAR == NR. */
  sarIsOurs: boolean;
  sarAvgIsOurs: boolean;
}

/** Foto de los récords traída de la WCA en vivo (§6 quedó desactualizado: hoy hay endpoint). */
export interface LiveRecords {
  fetchedAt: string;
  events: Record<string, LiveEventRecords>;
}

/**
 * Desde cuándo vemos este valor de récord. Reemplaza a `nrDate` del export cuando
 * el récord cae después de la última generación: sin esto la antigüedad quedaría
 * congelada y un récord recién roto seguiría cobrando factor de récord viejo.
 */
export interface SeenRecord {
  value: number;
  since: string;
}

/** Rotura detectada por el fetch que todavía no tiene pago registrado. */
export interface PendingBreak {
  key: string;
  oldValue: number;
  newValue: number;
  detectedAt: string;
}

/**
 * El reparto congelado: los factores y porcentajes que se calcularon la última
 * vez que entró plata. La página pública lee esto tal cual — no rehace las
 * cuentas en cada visita, porque los montos solo cambian cuando la AUS aporta.
 */
export interface FrozenDistribution {
  at: string;
  config: FundConfig;
  /** Cuándo se trajeron los récords de la WCA para este cálculo. */
  recordsFetchedAt: string | null;
  /** Los 33 fondos con sus factores y % ya resueltos. Los saldos se superponen. */
  funds: RecordFund[];
}

/** Lo único que se persiste. Lo demás se recalcula. */
export interface PersistedState {
  config: FundConfig;
  balances: Record<string, FundBalance>;
  ledger: LedgerEntry[];
  updatedAt: string;
  /** Últimos récords traídos de la WCA. Sin esto se usa el export estático. */
  live?: LiveRecords;
  /** key del fondo → valor visto y desde cuándo. */
  seen?: Record<string, SeenRecord>;
  /** Roturas detectadas sin pago registrado. */
  pendingBreaks?: PendingBreak[];
  /** Reparto vigente. Se recalcula solo cuando entra plata. */
  distribution?: FrozenDistribution;
}

/** Un fondo ya resuelto: datos WCA + balance + factores calculados. */
export interface RecordFund {
  key: string;
  eventId: string;
  name: string;
  kind: RecordKind;
  /** MBLD: más puntos es mejor. Invierte dificultad y margen. */
  inverted: boolean;
  fund: number;
  bonusPaidBy: string[];
  wr: number;
  nr: number;
  nrDate: string;
  days: number;
  ppl: number;
  m0: number;
  m0Roturas: number;
  sar: number;
  sarPais: string;
  /** El sudamericano ya es uruguayo: sin cambio de país no hay bonus (§4.3). */
  sarIsOurs: boolean;
  /** De dónde salen wr/nr/sar de este fondo. */
  source: "live" | "export";
  /** Factores del reparto (§3). */
  dif: number;
  t: number;
  n: number;
  score: number;
  pct: number;
}

export const FONDO_UNIDADES: Record<string, string> = {
  "333fm": "movimientos",
  "333mbf": "puntos",
};

export const DEFAULT_CONFIG: FundConfig = {
  alpha: 0.45,
  beta: 0.35,
  gamma: 0.2,
  tau: 365,
  participationDir: "mas",
  fMin: 0.25,
  fMax: 0.8,
  fBonus: 0.85,
  m0Fallback: 0.03,
};
