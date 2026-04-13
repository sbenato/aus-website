import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getUruguayDelegates } from "@/lib/wca-api";

export const metadata: Metadata = {
  title: "Sobre AUS",
  description:
    "Conocé la Asociación Uruguaya de Speedcubing: nuestra historia, misión y cómo participar.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Sobre AUS</h1>
        <p className="text-gray-500 mt-2">Asociación Uruguaya de Speedcubing</p>
      </div>

      <div className="prose prose-gray max-w-none space-y-8">
        {/* Mission */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
          <p className="text-gray-600 leading-relaxed">
            La Asociación Uruguaya de Speedcubing (AUS) es la organización oficial
            que representa al speedcubing en Uruguay ante la World Cube Association
            (WCA). Nuestro objetivo es organizar competencias WCA de alta calidad,
            fomentar el crecimiento de la comunidad cubers y conectar a los
            entusiastas del cubo de Rubik en todo el país.
          </p>
        </section>

        {/* History */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Historia</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            La AUS nació de la iniciativa de un grupo de speedcubers uruguayos
            que buscaban darle estructura oficial a la comunidad y garantizar la
            continuidad de las competencias WCA en el país.
          </p>

          {/* Timeline */}
          <ol className="relative border-l-2 border-brand-blue/20 space-y-8 ml-3">
            <li className="pl-6">
              <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-brand-blue border-2 border-white shadow" />
              <time className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                10 de agosto de 2022
              </time>
              <h3 className="font-semibold text-gray-900 mt-1">Fundación de la AUS</h3>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                En la ciudad de Montevideo, bajo la presidencia de Sebastiano
                Benato Moreira, se reúnen los miembros fundadores y firman el
                acta constitutiva de la Asociación Uruguaya de Speedcubing. El
                objetivo declarado: <em>organizar, desarrollar, fomentar y
                difundir la práctica del speedcubing en Uruguay</em>.
              </p>
            </li>
            <li className="pl-6">
              <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-brand-gold border-2 border-white shadow" />
              <time className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                10 de febrero de 2023
              </time>
              <h3 className="font-semibold text-gray-900 mt-1">Personería Jurídica</h3>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                El Ministerio de Educación y Cultura aprueba el estatuto de la
                AUS y le reconoce calidad de persona jurídica mediante la
                Resolución M.E.C 0185/023, firmada por el Dr. Pablo da
                Silveira.
              </p>
            </li>
          </ol>
        </section>

        {/* Delegates — streamed */}
        <Suspense fallback={<DelegatesSkeleton />}>
          <DelegatesSection />
        </Suspense>

        {/* WCA Affiliation */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Afiliación WCA</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            AUS organiza competencias oficiales homologadas por la{" "}
            <a
              href="https://www.worldcubeassociation.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue font-semibold hover:underline"
            >
              World Cube Association
            </a>
            . Esto significa que todos los resultados obtenidos en nuestras
            competencias son válidos para el ranking mundial y los competidores
            obtienen su ID WCA oficial.
          </p>
          <p className="text-gray-600 leading-relaxed">
            La WCA es el organismo internacional que regula las competencias de
            speedcubing en más de 100 países alrededor del mundo.
          </p>
        </section>

        {/* How to participate */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Cómo Participar?</h2>
          <ol className="space-y-4 text-gray-600">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <strong className="text-gray-900">Creá tu cuenta WCA</strong>
                <p className="mt-0.5">
                  Registrate en{" "}
                  <a
                    href="https://www.worldcubeassociation.org/users/sign_up"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:underline"
                  >
                    worldcubeassociation.org
                  </a>{" "}
                  para poder inscribirte en competencias.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <strong className="text-gray-900">Seguí nuestras redes</strong>
                <p className="mt-0.5">
                  Seguinos en Instagram{" "}
                  <a
                    href="https://www.instagram.com/aus.uy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue font-semibold hover:underline"
                  >
                    @aus.uy
                  </a>{" "}
                  para estar al tanto de nuevas competencias y noticias.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <strong className="text-gray-900">Inscribite a una competencia</strong>
                <p className="mt-0.5">
                  Cuando haya una{" "}
                  <Link href="/competitions" className="text-brand-blue hover:underline">
                    competencia disponible
                  </Link>
                  , inscribite antes del cierre de inscripciones.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gold text-gray-900 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <div>
                <strong className="text-gray-900">¡Competí!</strong>
                <p className="mt-0.5">
                  Venite a la competencia y divertite. Luego de tu primera
                  competencia oficial, ¡obtenés tu ID WCA para siempre!
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Contact */}
        <section className="bg-brand-navy text-white rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-4">Contacto</h2>
          <p className="text-blue-100 leading-relaxed mb-6">
            Para consultas sobre competencias, organización o cualquier tema
            relacionado con AUS, podés contactarnos a través de nuestras redes
            sociales.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/aus.uy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@aus.uy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
              </svg>
              TikTok
            </a>
            <a
              href="https://chat.whatsapp.com/I1n4zIW7p11Hd8Ouef6uTp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Comunidad de WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

async function DelegatesSection() {
  const delegates = await getUruguayDelegates().catch(
    () => [] as Awaited<ReturnType<typeof getUruguayDelegates>>
  );

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Delegados WCA</h2>
      <p className="text-sm text-gray-500 mb-6">
        Delegados oficiales de la World Cube Association en Uruguay.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {delegates.map((d) => {
          const initials = d.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          const profileHref = d.wca_id ? `/members/${d.wca_id}` : undefined;
          const inner = (
            <>
              {d.avatar_thumb_url ? (
                <Image
                  src={d.avatar_thumb_url}
                  alt={d.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{d.name}</p>
                <p className="text-xs text-gray-500">{d.role}</p>
              </div>
            </>
          );
          return (
            <li key={d.name}>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DelegatesSkeleton() {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8 animate-pulse">
      <div className="h-6 w-36 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
