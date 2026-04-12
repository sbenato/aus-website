import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl mb-6">🔍</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-dark transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
