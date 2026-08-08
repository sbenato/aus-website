import type { Metadata } from "next";
import Link from "next/link";

import { PanelClient } from "@/components/records/PanelClient";
import { currentEditor, getSnapshot } from "@/lib/records/service";

export const metadata: Metadata = {
  title: "Panel del Fondo de Récords",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Panel de delegados: registrar roturas, política y correcciones de saldo. */
export default async function PanelPage() {
  const editor = await currentEditor();

  if (!editor.canEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Acceso restringido</h1>
        <p className="text-gray-600 mt-2">
          El panel del fondo es solo para los delegados de la AUS autorizados a
          administrarlo. Los valores de los premios son públicos y los podés ver
          sin permiso.
        </p>
        <Link
          href="/records"
          className="inline-block mt-6 text-brand-blue hover:underline"
        >
          ← Ver el Fondo de Récords
        </Link>
      </div>
    );
  }

  const snapshot = await getSnapshot();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/records" className="text-sm text-gray-500 hover:text-brand-blue">
        ← Fondo de Récords
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel del fondo</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Entrás como delegado de la WCA ({editor.actor}). Todo lo que hagas queda
          firmado en el historial público.
        </p>
      </header>

      <PanelClient
        funds={snapshot.funds}
        config={snapshot.config}
        total={snapshot.total}
        ledger={snapshot.ledger}
        pendingBreaks={snapshot.pendingBreaks}
        recordsFetchedAt={snapshot.recordsFetchedAt}
        ledgerTotal={snapshot.ledgerTotal}
      />
    </div>
  );
}
