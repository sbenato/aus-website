import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonByWcaId } from "@/lib/wca-api";
import { CompetitionsMapLoader } from "@/components/members/CompetitionsMapLoader";

interface Props {
  params: Promise<{ wca_id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wca_id } = await params;
  try {
    const data = await getPersonByWcaId(wca_id);
    return { title: `Mapa · ${data.person.name}` };
  } catch {
    return { title: "Mapa de competencias" };
  }
}

export default async function CompetitionsMapPage({ params }: Props) {
  const { wca_id } = await params;

  let personName = wca_id;
  try {
    const data = await getPersonByWcaId(wca_id);
    personName = data.person.name;
  } catch {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/members" className="hover:text-brand-blue transition-colors">
          Miembros
        </Link>
        <span>/</span>
        <Link href={`/members/${wca_id}`} className="hover:text-brand-blue transition-colors">
          {personName}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Mapa</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mapa de competencias</h1>
      <p className="text-gray-500 text-sm mb-6">
        Competencias organizadas y/o delegadas por {personName}. Los marcadores se cargan progresivamente.
      </p>

      <CompetitionsMapLoader wcaId={wca_id} />
    </div>
  );
}
