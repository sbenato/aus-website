"use client";

import { useMemo, useState } from "react";

import { computePayout, fCurve } from "@/lib/records/engine";
import { fundLabel, money, money2, pct, unidad, valueLabel } from "@/lib/records/format";
import type { FundConfig, RecordFund } from "@/lib/records/types";

/**
 * Consulta pública: "si bajo el récord a X, ¿cuánto cobro?".
 * Calcula en el navegador con las mismas funciones que usa el servidor.
 */
export function PrizeCalculator({
  funds,
  config,
}: {
  funds: RecordFund[];
  config: FundConfig;
}) {
  const [key, setKey] = useState(funds[0]?.key ?? "");
  const [value, setValue] = useState("");

  const fund = funds.find((f) => f.key === key) ?? funds[0];
  const target = Number(value.replace(",", "."));

  const payout = useMemo(() => {
    if (!fund || !(target > 0)) return null;
    return computePayout({
      fund,
      config,
      oldValue: null,
      newValue: target,
      // Sin WCA ID no hay bonus continental (§4.3: tope por persona).
      wcaId: "",
    });
  }, [fund, config, target]);

  const ladder = useMemo(() => {
    if (!fund || !(fund.nr > 0)) return [];
    return [0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2].map((m) => {
      const f = fCurve(m, fund.m0, config);
      let objetivo = fund.inverted ? fund.nr * (1 + m) : fund.nr * (1 - m);
      // MBLD son puntos y FMC movimientos: un objetivo con decimales es
      // inalcanzable, y redondeando hacia abajo ni siquiera mejora el récord.
      if (fund.inverted) objetivo = Math.ceil(objetivo);
      else if (fund.eventId === "333fm") objetivo = Math.floor(objetivo);
      return { m, f, objetivo, prize: fund.fund * f };
    });
  }, [fund, config]);

  if (!fund) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <h2 className="font-bold text-gray-900">¿Cuánto cobraría?</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        Cálculo público con la política vigente. El pago real lo registra un delegado.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <label className="text-sm">
          <span className="text-gray-600">Récord</span>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {funds.map((f) => (
              <option key={f.key} value={f.key}>
                {fundLabel(f)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-gray-600">Tu resultado ({unidad(fund)})</span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={fund.nr > 0 ? String(fund.nr) : "0"}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums"
          />
        </label>

        <div className="text-sm">
          <span className="text-gray-600">Récord actual</span>
          <p className="mt-1 px-3 py-2 rounded-lg bg-gray-50 text-gray-900 tabular-nums">
            {valueLabel(fund, fund.nr)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        {!payout ? (
          <p className="text-sm text-gray-500">
            Cargá un resultado para ver el premio. Fondo disponible:{" "}
            <strong className="text-gray-900">{money(fund.fund)}</strong>.
          </p>
        ) : payout.f <= 0 ? (
          <p className="text-sm text-gray-600">
            {valueLabel(fund, target)} no mejora el récord de{" "}
            {valueLabel(fund, fund.nr)}: no hay premio.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-gray-500">Premio</p>
              <p className="text-2xl font-bold text-brand-blue tabular-nums">
                {money2(payout.prize)}
              </p>
            </div>
            <div className="text-sm text-gray-600 tabular-nums">
              <p>
                Mejora {payout.m !== null ? pct(payout.m, 2) : "—"} · fracción{" "}
                {pct(payout.f)} del fondo
              </p>
              <p>
                Queda en el fondo {money(payout.fundAfter)} · m₀ ={" "}
                {payout.m0.toFixed(3)}
              </p>
              {payout.continentalFlip && (
                <p className="text-brand-gold-dark font-medium">
                  Además le saca el sudamericano a {fund.sarPais || "otro país"}: con tu WCA ID el
                  delegado paga el bonus ({pct(config.fBonus)}), una sola vez por
                  persona y evento.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Qué pagaría cada mejora
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Ejemplos concretos sobre el récord actual, con el fondo de hoy.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full mt-2 text-xs min-w-80">
            <thead className="text-gray-500 text-left">
              <tr>
                <th className="py-1 font-medium">Mejora</th>
                <th className="py-1 font-medium">Objetivo</th>
                <th className="py-1 font-medium text-right">Fracción</th>
                <th className="py-1 font-medium text-right">Premio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ladder.map((row) => (
                <tr key={row.m}>
                  <td className="py-1 tabular-nums">{pct(row.m, 1)}</td>
                  <td className="py-1 tabular-nums">
                    {valueLabel(fund, row.objetivo)}
                  </td>
                  <td className="py-1 text-right tabular-nums">{pct(row.f)}</td>
                  <td className="py-1 text-right tabular-nums font-medium">
                    {money(row.prize)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
