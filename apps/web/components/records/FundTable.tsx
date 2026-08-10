"use client";

import { Fragment, useState } from "react";

import { getEventInfo } from "@/lib/wca-events";
import { antiguedad, fundLabel, money, pct, valueLabel } from "@/lib/records/format";
import type { RecordFund } from "@/lib/records/types";

type SortKey = "fund" | "dif" | "days" | "ppl" | "name";

const columns: { key: SortKey; label: string; help: string }[] = [
  { key: "fund", label: "Fondo", help: "Plata acumulada en este récord" },
  { key: "dif", label: "Dificultad", help: "WR / NR — 1 = récord a nivel mundial" },
  { key: "days", label: "Antigüedad", help: "Tiempo sin caer" },
  { key: "ppl", label: "Gente", help: "Competidores del evento en la ventana" },
];

export function FundTable({ funds }: { funds: RecordFund[] }) {
  const [sort, setSort] = useState<SortKey>("fund");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...funds].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "es");
    return b[sort] - a[sort];
  });
  const maxFund = Math.max(...funds.map((f) => f.fund), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-gray-900">Los 33 fondos</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Un fondo por récord: single y media son independientes. Multi a ciegas no
            tiene media.
          </p>
        </div>
        <label className="text-xs text-gray-600 flex items-center gap-2">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          >
            {columns.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
            <option value="name">Nombre</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="text-left">
              <th className="px-4 sm:px-6 py-2 font-medium">Récord</th>
              <th className="px-3 py-2 font-medium text-right">Fondo acumulado</th>
              <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">
                % del reparto
              </th>
              <th className="px-3 py-2 font-medium text-right hidden md:table-cell">
                Récord UY
              </th>
              <th className="px-3 py-2 font-medium text-right hidden lg:table-cell">
                Dificultad
              </th>
              <th className="px-3 py-2 font-medium text-right hidden lg:table-cell">
                Antigüedad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((f) => {
              const isOpen = expanded === f.key;
              return (
                <Fragment key={f.key}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : f.key)}
                    className="cursor-pointer hover:bg-blue-50/40"
                  >
                    <td className="px-4 sm:px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`cubing-icon event-${f.eventId} text-brand-blue`}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-gray-900">
                          {getEventInfo(f.eventId).nameEs}
                        </span>
                        <span className="text-xs text-gray-500">
                          {f.kind === "average" ? "media" : "single"}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded bg-gray-100 w-32 sm:w-40">
                        <div
                          className="h-1 rounded bg-brand-gold"
                          style={{ width: `${(f.fund / maxFund) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 tabular-nums">
                      {money(f.fund)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums hidden sm:table-cell">
                      {pct(f.pct)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums hidden md:table-cell">
                      {valueLabel(f, f.nr)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums hidden lg:table-cell">
                      {f.dif.toFixed(3)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums hidden lg:table-cell">
                      {antiguedad(f.days)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={6} className="px-4 sm:px-6 py-3">
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <Detail label="Récord uruguayo" value={valueLabel(f, f.nr)} />
                          <Detail label="Récord mundial" value={valueLabel(f, f.wr)} />
                          <Detail
                            label="Sudamericano"
                            value={
                              f.sar > 0
                                ? `${valueLabel(f, f.sar)} · ${f.sarPais || "—"}`
                                : "—"
                            }
                          />
                          <Detail
                            label="Competidores"
                            value={f.ppl > 0 ? String(f.ppl) : "—"}
                          />
                          <Detail
                            label="m₀ del evento"
                            value={`${f.m0.toFixed(3)}${
                              f.m0Roturas > 0 ? ` (${f.m0Roturas} roturas)` : " (por defecto)"
                            }`}
                          />
                          <Detail label="Dificultad" value={f.dif.toFixed(3)} />
                          <Detail label="Antigüedad" value={f.t.toFixed(3)} />
                          <Detail label="Participación" value={f.n.toFixed(3)} />
                        </dl>
                        <p className="mt-2 text-xs text-gray-500">
                          {fundLabel(f)} — puntaje {f.score.toFixed(4)}, se lleva{" "}
                          {pct(f.pct, 2)} de cada aporte de la AUS.
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 tabular-nums">{value}</dd>
    </div>
  );
}
