"use client";

import Link from "next/link";

import { FundTable } from "./FundTable";
import { LedgerList } from "./LedgerList";
import { PrizeCalculator } from "./PrizeCalculator";
import { fechaCorta, fechaHora, money, pct } from "@/lib/records/format";
import type { FundConfig, LedgerEntry, RecordFund } from "@/lib/records/types";

export interface DashboardProps {
  pais: string;
  generado: string;
  funds: RecordFund[];
  config: FundConfig;
  total: number;
  ledger: LedgerEntry[];
  updatedAt: string;
  recordsFetchedAt: string | null;
  calculatedAt: string | null;
  ledgerTotal: number;
  /** Solo habilita el acceso al panel; nada sensible se renderiza acá. */
  canEdit: boolean;
}

export function RecordsDashboard(props: DashboardProps) {
  const { funds, config, total, ledger } = props;

  const conPlata = funds.filter((f) => f.fund > 0).length;
  const mayor = [...funds].sort((a, b) => b.fund - a.fund)[0];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat
          label="Total en los fondos"
          value={money(total)}
          hint={`${conPlata} de ${funds.length} récords con plata`}
        />
        <Stat
          label="Premio más grande hoy"
          value={mayor ? money(mayor.fund) : "$0"}
          hint={
            mayor
              ? `${mayor.name} · ${mayor.kind === "average" ? "media" : "single"}`
              : "—"
          }
        />
        <Stat
          label="Pesos vigentes"
          value={`${pct(config.alpha / (config.alpha + config.beta + config.gamma), 0)} / ${pct(
            config.beta / (config.alpha + config.beta + config.gamma),
            0
          )} / ${pct(config.gamma / (config.alpha + config.beta + config.gamma), 0)}`}
          hint="dificultad / antigüedad / participación"
        />
      </div>

      {props.canEdit && (
        <Link
          href="/records/panel"
          className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-blue/40 hover:bg-blue-50/40 transition-colors"
        >
          <span className="text-sm text-gray-700">
            Tenés permiso de edición sobre el fondo.
          </span>
          <span className="text-sm font-medium text-brand-blue">
            Ir al panel →
          </span>
        </Link>
      )}

      <PrizeCalculator funds={funds} config={config} />

      <FundTable funds={funds} />

      <LedgerList ledger={ledger} funds={funds} total={props.ledgerTotal} />

      <p className="text-xs text-gray-400">
        {props.calculatedAt
          ? `Reparto calculado el ${fechaHora(props.calculatedAt)}, con los récords de la WCA de ese momento. Los porcentajes se rehacen solo cuando la AUS carga plata.`
          : "Todavía no entró plata: los porcentajes son una previsualización con el export de la WCA."}{" "}
        Competidores por evento y m₀ salen del export al {fechaCorta(props.generado)}.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
    </div>
  );
}
