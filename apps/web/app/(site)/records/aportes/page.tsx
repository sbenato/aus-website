import type { Metadata } from "next";
import Link from "next/link";

import { AporteForm } from "@/components/records/AporteForm";
import { currentEditor, getSnapshot } from "@/lib/records/service";
import { money } from "@/lib/records/format";

export const metadata: Metadata = {
  title: "Cargar aporte al fondo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Carga de plata: fuera de la página pública y solo para delegados/admins. */
export default async function AportesPage() {
  const editor = await currentEditor();

  if (!editor.canEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Acceso restringido</h1>
        <p className="text-gray-600 mt-2">
          Cargar plata al fondo está reservado a los delegados de la WCA en Uruguay
          y a los administradores de la AUS.
        </p>
        <Link
          href="/records"
          className="inline-block mt-6 text-brand-blue hover:underline"
        >
          ← Volver al fondo
        </Link>
      </div>
    );
  }

  const snapshot = await getSnapshot();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/records"
        className="text-sm text-gray-500 hover:text-brand-blue"
      >
        ← Fondo de Récords
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cargar aporte</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Hoy hay {money(snapshot.total)} repartidos entre los 33 fondos. Entrás
          como{" "}
          {editor.reason === "delegado"
            ? "delegado de la WCA"
            : "administrador de la AUS"}{" "}
          ({editor.actor}).
        </p>
      </header>

      <AporteForm funds={snapshot.funds} />
    </div>
  );
}
