"use client";

import { useState } from "react";

import { fechaHora, money, money2, pct, valueLabel } from "@/lib/records/format";
import type { LedgerEntry, RecordFund } from "@/lib/records/types";

const LABELS: Record<LedgerEntry["type"], { text: string; color: string }> = {
  reparto: { text: "Reparto", color: "bg-blue-100 text-blue-800" },
  pago: { text: "Pago", color: "bg-green-100 text-green-800" },
  config: { text: "Política", color: "bg-yellow-100 text-yellow-800" },
  ajuste: { text: "Ajuste", color: "bg-gray-100 text-gray-700" },
};

/** Historial público: todo movimiento del fondo queda auditable (§9). */
export function LedgerList({
  ledger,
  funds,
  total,
}: {
  ledger: LedgerEntry[];
  funds: RecordFund[];
  /** Asientos totales; la página recibe solo un tramo. */
  total?: number;
}) {
  const [limit, setLimit] = useState(15);
  const nameOf = (key: string) => {
    const f = funds.find((x) => x.key === key);
    return f ? `${f.name} · ${f.kind === "average" ? "media" : "single"}` : key;
  };
  const fundOf = (key: string) => funds.find((x) => x.key === key);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <h2 className="font-bold text-gray-900">Historial</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        Cada aporte, pago y cambio de política, con quién lo hizo.
      </p>

      {ledger.length === 0 ? (
        <p className="text-sm text-gray-500 mt-4">
          Todavía no hay movimientos. El fondo arranca en cero.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {ledger.slice(0, limit).map((e) => (
            <li
              key={e.id}
              className="border-l-2 border-gray-100 pl-3 py-0.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 font-medium ${LABELS[e.type].color}`}
                >
                  {LABELS[e.type].text}
                </span>
                <span className="text-gray-400">{fechaHora(e.at)}</span>
                <span className="text-gray-500">· {e.by}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {e.type === "reparto" && (
                  <>
                    Se repartieron <strong>{money2(e.amount)}</strong> entre los{" "}
                    {Object.keys(e.allocations).length} fondos.
                  </>
                )}
                {e.type === "pago" && (
                  <>
                    <strong>{e.wcaId}</strong> rompió {nameOf(e.key)}
                    {(() => {
                      const f = fundOf(e.key);
                      return f
                        ? ` con ${valueLabel(f, e.newValue)}${
                            e.oldValue ? ` (antes ${valueLabel(f, e.oldValue)})` : ""
                          }`
                        : "";
                    })()}{" "}
                    y cobró <strong>{money2(e.prize)}</strong> ({pct(e.f)} del fondo
                    {e.bonus ? ", con bonus continental" : ""}). Quedan{" "}
                    {money(e.fundAfter)}.
                  </>
                )}
                {e.type === "config" && (
                  <>
                    Cambió la política:{" "}
                    {describeConfigDiff(
                      e.before as unknown as Record<string, unknown>,
                      e.after as unknown as Record<string, unknown>
                    ) || "sin cambios efectivos"}.
                  </>
                )}
                {e.type === "ajuste" && (
                  <>
                    Corrigió {nameOf(e.key)}: {money2(e.fundBefore)} →{" "}
                    <strong>{money2(e.fundAfter)}</strong>.
                  </>
                )}
              </p>
              {"note" in e && e.note && (
                <p className="text-xs text-gray-500 italic mt-0.5">{e.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {ledger.length > limit ? (
        <button
          onClick={() => setLimit((l) => l + 25)}
          className="mt-4 text-sm text-brand-blue hover:underline"
        >
          Ver más movimientos
        </button>
      ) : (
        total !== undefined &&
        total > ledger.length && (
          <p className="mt-4 text-xs text-gray-400">
            Se muestran los {ledger.length} movimientos más recientes de {total}.
          </p>
        )
      )}
    </div>
  );
}

const CONFIG_LABELS: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  tau: "τ",
  participationDir: "dirección de participación",
  fMin: "f_min",
  fMax: "f_max",
  fBonus: "bonus continental",
  m0Fallback: "m₀ por defecto",
};

function describeConfigDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string {
  return Object.keys(CONFIG_LABELS)
    .filter((k) => before[k] !== after[k])
    .map((k) => `${CONFIG_LABELS[k]} ${String(before[k])} → ${String(after[k])}`)
    .join(", ");
}
