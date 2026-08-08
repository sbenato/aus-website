"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AdminApiResult } from "./AdminPanel";
import { Button } from "@/components/ui/Button";
import { distribute } from "@/lib/records/engine";
import { fundLabel, money, money2 } from "@/lib/records/format";
import { describeMoney, parseMoney } from "@/lib/records/parse-money";
import type { RecordFund } from "@/lib/records/types";

/**
 * Carga de plata al fondo.
 *
 * A propósito cuesta: es la única operación que mete plata nueva, dispara el
 * recálculo de los 33 fondos y no se deshace con un botón. Tres pasos: cargar,
 * revisar el reparto completo, y confirmar tipeando el monto de nuevo. La
 * fricción es el formulario, no estar en otra página.
 */
export function AporteForm({
  funds,
  onApplied,
}: {
  funds: RecordFund[];
  /** Avisa al panel para que refresque saldos e historial sin recargar. Sin
   *  esto, `router.refresh()` actualiza las props pero no el estado ya montado. */
  onApplied?: (data: AdminApiResult) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"carga" | "revision">("carga");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  // Se genera al pasar a revisión y se mantiene entre reintentos: si la conexión
  // se corta después de que el servidor aplicó, el reintento no duplica el aporte.
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    amount: number;
    warning: string | null;
    repetido: boolean;
  } | null>(null);

  const parsed = parseMoney(amount);
  const value = parsed ?? 0;
  const valid = parsed !== null && parsed > 0;
  const preview = valid ? distribute(funds, value) : null;
  const ordenados = preview
    ? [...funds].sort((a, b) => preview[b.key] - preview[a.key])
    : [];
  // El monto tipeado de nuevo tiene que coincidir: evita el cero de más.
  const confirmOk = valid && parseMoney(confirm) === value;

  async function enviar() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/records/reparto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          note: note || undefined,
          requestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar el aporte.");
        return;
      }
      setDone({
        amount: value,
        warning: data.refreshWarning ?? null,
        repetido: !!data.repetido,
      });
      onApplied?.(data);
      router.refresh();
    } catch {
      setError("Error de red. El aporte no se cargó.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6">
        <h2 className="font-bold text-green-900">
          Aporte de {money(done.amount)} cargado
        </h2>
        <p className="text-sm text-green-800 mt-1">
          {done.repetido
            ? "Este aporte ya estaba cargado: el reintento no lo duplicó."
            : "Se repartió entre los 33 fondos y quedó firmado en el historial público."}
        </p>
        {done.warning && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            {done.warning}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Link
            href="/records"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-4 py-2 text-sm bg-brand-blue text-white hover:bg-brand-blue-dark transition-colors"
          >
            Ver los fondos
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setDone(null);
              setStep("carga");
              setAmount("");
              setNote("");
              setConfirm("");
              setRequestId("");
            }}
          >
            Cargar otro aporte
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-white overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 text-amber-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h2 className="font-bold text-amber-900">
              Estás por meter plata nueva al fondo
            </h2>
            <ul className="text-sm text-amber-900/90 mt-1 space-y-0.5 list-disc list-inside">
              <li>El monto se reparte entero entre los 33 récords.</li>
              <li>
                Se traen los récords actuales de la WCA y se recalculan todos los
                porcentajes.
              </li>
              <li>
                No hay deshacer: revertirlo es corregir 33 saldos a mano, y queda
                firmado con tu WCA ID en el historial público.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {step === "carga" ? (
        <div className="p-4 sm:p-6 space-y-4 max-w-md">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Monto del aporte</span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <span className="block text-xs mt-1">
              {amount.trim() === "" ? (
                <span className="text-gray-500">
                  El punto separa miles y la coma decimales: 10.000 son diez mil.
                </span>
              ) : valid ? (
                <span className="text-gray-700">
                  Se va a cargar <strong>{describeMoney(amount)}</strong>.
                </span>
              ) : (
                <span className="text-red-600">No se entiende ese monto.</span>
              )}
            </span>
          </label>

          <label className="block text-sm">
            <span className="text-gray-700 font-medium">De dónde sale</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aporte aprobado en la asamblea de agosto"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="block text-xs text-gray-500 mt-1">
              Queda en el historial público. Poné algo que se entienda dentro de un
              año.
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setRequestId(crypto.randomUUID());
                setStep("revision");
              }}
              disabled={!valid}
            >
              Revisar el reparto
            </Button>
            <Link
              href="/records"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-gray-900">
              Así queda el reparto de {money(value)}
            </h3>
            <button
              onClick={() => setStep("carga")}
              className="text-sm text-brand-blue hover:underline"
            >
              ← Cambiar el monto
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Calculado con los porcentajes vigentes. Al confirmar se recalculan con
            los récords del momento, así que los números finales pueden moverse un
            poco.
          </p>

          <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {ordenados.map((f) => (
                  <tr key={f.key}>
                    <td className="px-3 py-1.5 text-gray-700">{fundLabel(f)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500 tabular-nums">
                      {money2(f.fund)} →
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900 tabular-nums">
                      {money2(f.fund + (preview?.[f.key] ?? 0))}
                    </td>
                    <td className="px-3 py-1.5 text-right text-green-700 tabular-nums w-24">
                      +{money2(preview?.[f.key] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-sm text-gray-700">
            Total repartido:{" "}
            <strong className="tabular-nums">
              {money2(
                Object.values(preview ?? {}).reduce((s, v) => s + v, 0)
              )}
            </strong>{" "}
            entre {ordenados.length} fondos.
          </p>

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 max-w-md">
            <label className="block text-sm">
              <span className="font-medium text-amber-900">
                Escribí el monto otra vez para confirmar
              </span>
              <input
                inputMode="decimal"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={String(value)}
                className="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
            <Button
              variant="danger"
              className="mt-3 w-full"
              onClick={enviar}
              loading={busy}
              disabled={!confirmOk}
            >
              Confirmar aporte de {money(value)}
            </Button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
