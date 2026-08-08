"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { fechaHora, fundLabel, money, money2, pct, unidad, valueLabel } from "@/lib/records/format";
import { describeMoney, parseMoney } from "@/lib/records/parse-money";
import type { FundConfig, PendingBreak, RecordFund } from "@/lib/records/types";

type Tab = "pago" | "politica" | "ajuste";

const TABS: { id: Tab; label: string }[] = [
  { id: "pago", label: "Registrar rotura" },
  { id: "politica", label: "Política" },
  { id: "ajuste", label: "Corregir saldo" },
];

export interface AdminApiResult {
  funds?: RecordFund[];
  config?: FundConfig;
  ledger?: unknown[];
  total?: number;
  updatedAt?: string;
  error?: string;
  /** Fecha del último fetch de récords a la WCA. */
  fetchedAt?: string;
  refreshedAt?: string | null;
  refreshWarning?: string | null;
  breaks?: PendingBreak[];
  pendingBreaks?: PendingBreak[];
}

export function AdminPanel({
  funds,
  config,
  reason,
  recordsFetchedAt,
  pendingBreaks,
  onApplied,
}: {
  funds: RecordFund[];
  config: FundConfig;
  reason: "delegado" | "admin";
  recordsFetchedAt: string | null;
  pendingBreaks: PendingBreak[];
  onApplied: (data: AdminApiResult) => void;
}) {
  const [tab, setTab] = useState<Tab>("pago");
  const [prefill, setPrefill] = useState<PendingBreak | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function send(url: string, method: string, body: unknown, success: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as AdminApiResult;
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return null;
      }
      onApplied(data);
      setOk(success);
      return data;
    } catch {
      setError("Error de red.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-brand-blue/30 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-3 bg-brand-blue/5 border-b border-brand-blue/20 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900">Panel de delegados</h2>
          <p className="text-xs text-gray-600">
            Entrás como {reason === "delegado" ? "delegado de la WCA" : "administrador de la AUS"}.
            Todo lo que hagas queda firmado en el historial público.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
                setOk(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-blue text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <RecordsBar
        recordsFetchedAt={recordsFetchedAt}
        pendingBreaks={pendingBreaks}
        funds={funds}
        onPagar={(b) => {
          setTab("pago");
          setPrefill(b);
          setError(null);
          setOk(null);
        }}
      />

      <div className="p-4 sm:p-6">
        {tab === "pago" && (
          <PagoForm
            // Remonta cuando cambia la rotura elegida: sin esto los valores
            // precargados se ignoraban (el componente ya estaba montado).
            key={prefill ? `${prefill.key}-${prefill.detectedAt}` : "nuevo"}
            funds={funds}
            config={config}
            busy={busy}
            send={send}
            prefill={prefill}
            onPagado={() => setPrefill(null)}
          />
        )}
        {tab === "politica" && (
          <PoliticaForm config={config} busy={busy} send={send} />
        )}
        {tab === "ajuste" && <AjusteForm funds={funds} busy={busy} send={send} />}

        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {ok && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            {ok}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Estado de los récords y roturas detectadas sin pago. Los récords se traen de la
 * WCA únicamente cuando entra plata: entre aporte y aporte los montos no cambian,
 * así que recalcularlos sería gasto puro.
 */
function RecordsBar({
  recordsFetchedAt,
  pendingBreaks,
  funds,
  onPagar,
}: {
  recordsFetchedAt: string | null;
  pendingBreaks: PendingBreak[];
  funds: RecordFund[];
  onPagar: (b: PendingBreak) => void;
}) {
  return (
    <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white">
      <p className="text-xs text-gray-600">
        Récords WCA:{" "}
        {recordsFetchedAt ? (
          <>traídos el {fechaHora(recordsFetchedAt)}</>
        ) : (
          <span className="text-amber-700">
            nunca — se está usando el export estático
          </span>
        )}
        . Se actualizan al cargar plata.
      </p>

      <Link
        href="/records/aportes"
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 hover:underline"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Cargar plata al fondo
      </Link>

      {pendingBreaks.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-semibold text-amber-900">
            {pendingBreaks.length === 1
              ? "Se detectó una rotura sin pago registrado"
              : `Se detectaron ${pendingBreaks.length} roturas sin pago registrado`}
          </p>
          <ul className="mt-2 space-y-1">
            {pendingBreaks.map((b) => {
              const f = funds.find((x) => x.key === b.key);
              return (
                <li
                  key={`${b.key}-${b.detectedAt}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="text-amber-900">
                    {f ? fundLabel(f) : b.key}:{" "}
                    {f ? valueLabel(f, b.oldValue) : b.oldValue} →{" "}
                    <strong>{f ? valueLabel(f, b.newValue) : b.newValue}</strong>
                  </span>
                  <button
                    onClick={() => onPagar(b)}
                    className="text-brand-blue font-medium hover:underline"
                  >
                    Registrar el pago →
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-amber-800">
            La plata no sale sola: el pago necesita el WCA ID de quien lo rompió,
            porque el bonus continental se paga una sola vez por persona.
          </p>
        </div>
      )}
    </div>
  );
}

type Send = (
  url: string,
  method: string,
  body: unknown,
  success: string
) => Promise<AdminApiResult | null>;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm block">
      <span className="text-gray-700 font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-blue/40";

// ── Pago (§4) ────────────────────────────────────────────────────────────────

interface PayoutPreview {
  payout: {
    m: number | null;
    m0: number;
    f: number;
    bonus: boolean;
    continentalFlip: boolean;
    bonusAlreadyPaid: boolean;
    fundBefore: number;
    prize: number;
    fundAfter: number;
    reason: string;
  };
}

function PagoForm({
  funds,
  config,
  busy,
  send,
  prefill,
  onPagado,
}: {
  funds: RecordFund[];
  config: FundConfig;
  busy: boolean;
  send: Send;
  prefill: PendingBreak | null;
  onPagado: () => void;
}) {
  const [key, setKey] = useState(prefill?.key ?? funds[0]?.key ?? "");
  const [wcaId, setWcaId] = useState("");
  const [newValue, setNewValue] = useState(
    prefill ? String(prefill.newValue) : ""
  );
  const [oldValue, setOldValue] = useState(
    prefill ? String(prefill.oldValue) : ""
  );
  const [forceContinental, setForceContinental] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<PayoutPreview["payout"] | null>(null);
  // Contra reintentos tras timeout: el mismo pago no se cobra dos veces.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const fund = funds.find((f) => f.key === key);
  const body = {
    key,
    wcaId,
    newValue: Number(newValue.replace(",", ".")),
    oldValue: oldValue ? Number(oldValue.replace(",", ".")) : null,
    forceContinental,
    note: note || undefined,
  };
  const ready = !!fund && /^\d{4}[A-Z]{4}\d{2}$/i.test(wcaId) && body.newValue > 0;

  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  async function simular() {
    setSimBusy(true);
    setSimError(null);
    try {
      const res = await fetch("/api/records/pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, dryRun: true }),
      });
      const data = (await res.json()) as PayoutPreview & { error?: string };
      if (!res.ok) {
        setPreview(null);
        setSimError(data.error ?? "No se pudo simular.");
        return;
      }
      setPreview(data.payout);
    } catch {
      setPreview(null);
      setSimError("Error de red al simular.");
    } finally {
      setSimBusy(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <Field label="Récord roto">
          <select
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setPreview(null);
            }}
            className={inputClass}
          >
            {funds.map((f) => (
              <option key={f.key} value={f.key}>
                {fundLabel(f)} — {money(f.fund)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="WCA ID" hint="Formato 2023CABR01">
            <input
              value={wcaId}
              onChange={(e) => {
                setWcaId(e.target.value.toUpperCase());
                setPreview(null);
              }}
              placeholder="2023CABR01"
              className={inputClass}
            />
          </Field>
          <Field
            label={`Resultado nuevo${fund ? ` (${unidad(fund)})` : ""}`}
          >
            <input
              inputMode="decimal"
              value={newValue}
              onChange={(e) => {
                setNewValue(e.target.value);
                setPreview(null);
              }}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Récord anterior (opcional)"
          hint={
            fund && fund.nr > 0
              ? `Si lo dejás vacío se usa el récord vigente: ${fund.nr}`
              : undefined
          }
        >
          <input
            inputMode="decimal"
            value={oldValue}
            onChange={(e) => {
              setOldValue(e.target.value);
              setPreview(null);
            }}
            className={inputClass}
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={forceContinental}
            onChange={(e) => {
              setForceContinental(e.target.checked);
              setPreview(null);
            }}
            className="mt-1"
          />
          <span>
            Forzar bonus continental
            <span className="block text-xs text-gray-500">
              Solo si el export de la WCA todavía no tiene el sudamericano al día. El
              tope de una vez por persona y evento se sigue aplicando.
            </span>
          </span>
        </label>

        <Field label="Nota (opcional)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Uruguay Open 2026, ronda 2"
            className={inputClass}
          />
        </Field>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={simular}
            loading={simBusy}
            disabled={!ready || busy}
          >
            Simular
          </Button>
          <Button
            onClick={() =>
              send(
                "/api/records/pago",
                "POST",
                { ...body, requestId },
                `Pago registrado para ${wcaId.toUpperCase()}.`
              ).then((d) => {
                if (d) {
                  onPagado();
                  setRequestId(crypto.randomUUID());
                  setPreview(null);
                  setNewValue("");
                  setOldValue("");
                  setWcaId("");
                  setNote("");
                  setForceContinental(false);
                }
              })
            }
            loading={busy}
            disabled={!ready}
          >
            Registrar pago
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 text-sm">
        <p className="text-xs font-semibold text-gray-700">Simulación</p>
        {simError ? (
          <p className="text-xs text-red-700 mt-2">{simError}</p>
        ) : !preview ? (
          <p className="text-xs text-gray-500 mt-2">
            Apretá &ldquo;Simular&rdquo; para ver el premio antes de mover plata.
          </p>
        ) : (
          <dl className="mt-2 space-y-1 text-xs tabular-nums">
            <Row label="Fondo antes" value={money2(preview.fundBefore)} />
            <Row
              label="Margen de mejora"
              value={preview.m !== null ? pct(preview.m, 2) : "—"}
            />
            <Row label="m₀ del evento" value={preview.m0.toFixed(3)} />
            <Row label="Fracción f" value={pct(preview.f)} />
            <Row label="Premio" value={money2(preview.prize)} />
            <Row label="Queda en el fondo" value={money2(preview.fundAfter)} />
            <Row
              label="Bonus continental"
              value={
                preview.bonus
                  ? `sí (${pct(config.fBonus)})`
                  : preview.bonusAlreadyPaid
                    ? "ya lo cobró antes"
                    : preview.continentalFlip
                      ? "cambia de país, falta WCA ID"
                      : "no"
              }
            />
            <p className="pt-2 text-gray-600">{preview.reason}</p>
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

// ── Política (§3.4, §4.2, §4.3) ──────────────────────────────────────────────

function PoliticaForm({
  config,
  busy,
  send,
}: {
  config: FundConfig;
  busy: boolean;
  send: Send;
}) {
  const [draft, setDraft] = useState<FundConfig>(config);
  const sum = draft.alpha + draft.beta + draft.gamma || 1;

  const set = (patch: Partial<FundConfig>) =>
    setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Los pesos se normalizan solos a suma 1, así que cada slider es independiente.
        </p>
        <Slider
          label="α · dificultad"
          value={draft.alpha}
          share={draft.alpha / sum}
          onChange={(v) => set({ alpha: v })}
        />
        <Slider
          label="β · antigüedad"
          value={draft.beta}
          share={draft.beta / sum}
          onChange={(v) => set({ beta: v })}
        />
        <Slider
          label="γ · participación"
          value={draft.gamma}
          share={draft.gamma / sum}
          onChange={(v) => set({ gamma: v })}
        />

        <Field
          label={`τ · saturación de la antigüedad: ${Math.round(draft.tau)} días`}
          hint="Cuántos días tarda un récord en valer casi todo su factor antigüedad."
        >
          <input
            type="range"
            min={30}
            max={1825}
            step={5}
            value={draft.tau}
            onChange={(e) => set({ tau: Number(e.target.value) })}
            className="mt-2 w-full"
          />
        </Field>

        <Field
          label="Dirección de la participación"
          hint="Decisión de política: premiar el récord más disputado o incentivar categorías nicho."
        >
          <select
            value={draft.participationDir}
            onChange={(e) =>
              set({ participationDir: e.target.value as "mas" | "menos" })
            }
            className={inputClass}
          >
            <option value="mas">Más gente = más premio</option>
            <option value="menos">Menos gente = más premio</option>
          </select>
        </Field>
      </div>

      <div className="space-y-4">
        <Percent
          label="f_min · piso del pago"
          hint="Nunca 0: si no, con muchas mejoras chicas la plata no sale nunca."
          value={draft.fMin}
          onChange={(v) => set({ fMin: v })}
        />
        <Percent
          label="f_max · techo por margen"
          value={draft.fMax}
          onChange={(v) => set({ fMax: v })}
        />
        <Percent
          label="Bonus continental"
          hint="Se paga cuando el sudamericano pasa de otro país a Uruguay, una vez por persona y evento."
          value={draft.fBonus}
          onChange={(v) => set({ fBonus: v })}
        />
        <Field
          label={`m₀ por defecto: ${draft.m0Fallback.toFixed(3)}`}
          hint="Se usa en los eventos con menos de 3 roturas históricas."
        >
          <input
            type="range"
            min={0.005}
            max={0.15}
            step={0.005}
            value={draft.m0Fallback}
            onChange={(e) => set({ m0Fallback: Number(e.target.value) })}
            className="mt-2 w-full"
          />
        </Field>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              send("/api/records/config", "PUT", draft, "Política actualizada.")
            }
            loading={busy}
          >
            Guardar política
          </Button>
          <Button variant="ghost" onClick={() => setDraft(config)} disabled={busy}>
            Descartar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  share,
  onChange,
}: {
  label: string;
  value: number;
  share: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 tabular-nums">
          {value.toFixed(2)} → {pct(share)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </div>
  );
}

function Percent({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={`${label}: ${pct(value)}`} hint={hint}>
      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 w-full"
      />
    </Field>
  );
}

// ── Ajuste manual ────────────────────────────────────────────────────────────

function AjusteForm({
  funds,
  busy,
  send,
}: {
  funds: RecordFund[];
  busy: boolean;
  send: Send;
}) {
  const [key, setKey] = useState(funds[0]?.key ?? "");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const fund = funds.find((f) => f.key === key);
  const parsed = parseMoney(value);
  const nuevoSaldo = parsed ?? 0;
  const valido = parsed !== null;
  const delta = fund ? nuevoSaldo - fund.fund : 0;
  const listo = valido && !!fund && delta !== 0;

  return (
    <div className="space-y-3 max-w-lg">
      <p className="text-xs text-gray-500">
        Para corregir errores de carga o aportes dirigidos a un récord puntual. Fija
        el saldo en un valor absoluto — no suma ni resta. El saldo anterior y el
        nuevo quedan en el historial.
      </p>
      <Field label="Récord">
        <select
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setConfirmando(false);
          }}
          className={inputClass}
        >
          {funds.map((f) => (
            <option key={f.key} value={f.key}>
              {fundLabel(f)} — {money(f.fund)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Saldo nuevo"
        hint={fund ? `Saldo actual: ${money2(fund.fund)}` : undefined}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setConfirmando(false);
          }}
          className={inputClass}
        />
        <span className="block text-xs mt-1">
          {value.trim() === "" ? (
            <span className="text-gray-500">
              El punto separa miles y la coma decimales: 1.500 son mil quinientos.
            </span>
          ) : valido ? (
            <span className="text-gray-700">
              El fondo queda en <strong>{describeMoney(value)}</strong>.
            </span>
          ) : (
            <span className="text-red-600">No se entiende ese monto.</span>
          )}
        </span>
      </Field>
      <Field label="Motivo">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Corrección de carga del 3 de agosto"
          className={inputClass}
        />
      </Field>

      {!confirmando ? (
        <Button
          variant="danger"
          onClick={() => setConfirmando(true)}
          disabled={!listo || busy}
        >
          Corregir saldo
        </Button>
      ) : (
        /* Un ajuste fija un valor absoluto y no se deshace: antes de tocarlo hay
           que ver en pesos qué se está por sacar o poner. */
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900">
            {fund && fundLabel(fund)}: {money2(fund?.fund ?? 0)} →{" "}
            <strong>{money2(nuevoSaldo)}</strong>
          </p>
          <p className="text-sm font-semibold text-red-900 mt-1">
            {delta < 0
              ? `Se le sacan ${money2(Math.abs(delta))} al fondo.`
              : `Se le agregan ${money2(delta)} al fondo.`}
          </p>
          <p className="text-xs text-red-800 mt-1">
            No se deshace y queda firmado con tu WCA ID.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="danger"
              onClick={() =>
                send(
                  "/api/records/ajuste",
                  "POST",
                  { key, fund: nuevoSaldo, note: note || undefined },
                  "Saldo corregido."
                ).then((d) => {
                  if (d) {
                    setConfirmando(false);
                    setValue("");
                    setNote("");
                  }
                })
              }
              loading={busy}
            >
              Sí, corregir
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
