import type { Metadata } from "next";

import { RecordsDashboard } from "@/components/records/RecordsDashboard";
import { currentEditor, getSnapshot } from "@/lib/records/service";

export const metadata: Metadata = {
  title: "Fondo de Récords",
  description:
    "Cuánta plata acumula cada récord nacional uruguayo de la WCA y cuánto cobra quien lo rompe.",
};

// Los saldos cambian cuando un delegado carga un aporte o un pago.
export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const [snapshot, editor] = await Promise.all([getSnapshot(), currentEditor()]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fondo de Récords</h1>
        <p className="text-gray-500 mt-2 max-w-3xl">
          La AUS premia a quien rompe un récord nacional uruguayo de la WCA. Cada
          récord tiene su propio fondo: la plata que aporta la asociación se reparte
          según qué tan difícil, viejo y disputado está cada récord, y quien lo rompe
          cobra una fracción de ese fondo.
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Los valores son públicos. Editar la política, cargar aportes y registrar
          pagos queda reservado a los delegados de la AUS autorizados a
          administrar el fondo.
        </p>
      </header>

      <RecordsDashboard
        pais={snapshot.pais}
        generado={snapshot.generado}
        funds={snapshot.funds}
        config={snapshot.config}
        total={snapshot.total}
        ledger={snapshot.ledger}
        updatedAt={snapshot.updatedAt}
        recordsFetchedAt={snapshot.recordsFetchedAt}
        calculatedAt={snapshot.calculatedAt}
        ledgerTotal={snapshot.ledgerTotal}
        canEdit={editor.canEdit}
      />

      <section className="mt-10 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900">Cómo funciona</h2>
        <dl className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="font-semibold text-gray-900">33 fondos</dt>
            <dd className="text-gray-600 mt-0.5">
              Un fondo por récord: 17 eventos × 2 (single y media), menos la media de
              Multi a ciegas, que no existe.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Reparto</dt>
            <dd className="text-gray-600 mt-0.5">
              Cada aporte se reparte proporcional a un puntaje que mezcla dificultad
              (récord mundial ÷ récord uruguayo), antigüedad (crece pero satura) y
              participación (raíz de la cantidad de competidores).
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Pago parcial</dt>
            <dd className="text-gray-600 mt-0.5">
              Romper un récord no vacía el fondo: se paga una fracción que crece con
              el margen de mejora. En equilibrio se cobra lo mismo, pero nunca queda
              una categoría en cero y una disputa cerrada premia a los dos.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Bonus continental</dt>
            <dd className="text-gray-600 mt-0.5">
              Si además el récord sudamericano pasa de otro país a Uruguay, se paga
              una fracción mayor. Una sola vez por persona y por evento.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
