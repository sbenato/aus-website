"use client";

import { useState } from "react";

import { AdminPanel, type AdminApiResult } from "./AdminPanel";
import { AporteForm } from "./AporteForm";
import { LedgerList } from "./LedgerList";
import { money } from "@/lib/records/format";
import type {
  FundConfig,
  LedgerEntry,
  PendingBreak,
  RecordFund,
} from "@/lib/records/types";

/**
 * Estado del panel de delegados. Vive en `/records/panel`, separado de la página
 * pública: nada de esto lo ve alguien sin permiso de edición.
 */
export function PanelClient({
  funds: initialFunds,
  config: initialConfig,
  total: initialTotal,
  ledger: initialLedger,
  pendingBreaks: initialBreaks,
  recordsFetchedAt,
  ledgerTotal,
  reason,
}: {
  funds: RecordFund[];
  config: FundConfig;
  total: number;
  ledger: LedgerEntry[];
  pendingBreaks: PendingBreak[];
  recordsFetchedAt: string | null;
  ledgerTotal: number;
  reason: "delegado" | "admin";
}) {
  const [funds, setFunds] = useState(initialFunds);
  const [config, setConfig] = useState(initialConfig);
  const [total, setTotal] = useState(initialTotal);
  const [ledger, setLedger] = useState(initialLedger);
  const [breaks, setBreaks] = useState(initialBreaks);

  function onApplied(data: AdminApiResult) {
    if (data.funds) setFunds(data.funds);
    if (data.config) setConfig(data.config);
    if (typeof data.total === "number") setTotal(data.total);
    if (data.ledger) setLedger(data.ledger as LedgerEntry[]);
    if (data.pendingBreaks) setBreaks(data.pendingBreaks);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Hay <strong className="text-gray-900">{money(total)}</strong> repartidos
        entre los {funds.length} fondos.
      </p>

      {/* Primero cargar plata: es lo que recalcula el reparto que usa todo lo
          de abajo. El formulario ya trae sus tres pasos de confirmación. */}
      <section>
        <h2 className="font-bold text-gray-900">Cargar aporte</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          Lo único que mete plata nueva y rehace el reparto de los 33 fondos.
        </p>
        <AporteForm funds={funds} onApplied={onApplied} />
      </section>

      <AdminPanel
        funds={funds}
        config={config}
        reason={reason}
        recordsFetchedAt={recordsFetchedAt}
        pendingBreaks={breaks}
        onApplied={onApplied}
      />

      <LedgerList ledger={ledger} funds={funds} total={ledgerTotal} />
    </div>
  );
}
