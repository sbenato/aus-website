import type { Metadata } from "next";
import Link from "next/link";

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

        {/* Founding members */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Miembros Fundadores</h2>
          <p className="text-sm text-gray-500 mb-6">
            Las 12 personas que firmaron el acta constitutiva el 10 de agosto de 2022.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Sebastiano Gabriel Benato Moreira", role: "Presidente" },
              { name: "Agustín Diano Scarpa", role: "Secretario" },
              { name: "Gennaro Vincenzo Monetti Cracco", role: "Tesorero" },
              { name: "Diego Martín Moraes Fernández", role: "Suplente CD" },
              { name: "María Belén Carozo Jocin", role: "Suplente CD" },
              { name: "Ernesto Cabrera Martínez", role: "Sindicatura" },
              { name: "Ignacio Goñi Spinoglio", role: "Suplente Sindicatura" },
              { name: "Brian Rudy Hambeck Varela", role: "Miembro fundador" },
              { name: "Víctor Manuel Gálvez González", role: "Miembro fundador" },
              { name: "Franco Campanella Aurrecochea", role: "Miembro fundador" },
              { name: "Oscar Daniel Leiton Martínez", role: "Miembro fundador" },
              { name: "Damián Méndez Soria", role: "Miembro fundador" },
            ].map((m) => (
              <li
                key={m.name}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xs font-bold shrink-0">
                  {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

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
          <a
            href="https://www.instagram.com/aus.uy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
            @aus.uy en Instagram
          </a>
        </section>
      </div>
    </div>
  );
}
