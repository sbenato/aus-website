import Link from "next/link";
import { getUpcomingUruguayCompetitions } from "@/lib/wca-api";
import { CompetitionCard } from "@/components/competitions/CompetitionCard";
import { LoginButton } from "@/components/auth/LoginButton";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  let upcomingComps: Awaited<ReturnType<typeof getUpcomingUruguayCompetitions>> = [];
  try {
    upcomingComps = await getUpcomingUruguayCompetitions(3);
  } catch {
    // If WCA API is unavailable, show empty state
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
              🇺🇾 Uruguay · @aus.uy
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-6">
              Asociación Uruguaya de{" "}
              <span className="text-brand-gold">Speedcubing</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed mb-10">
              La comunidad oficial de speedcubing en Uruguay. Organizamos
              competencias homologadas por la WCA, conectamos cubers de todo
              el país y fomentamos el crecimiento del cubo de Rubik.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/competitions"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-gold text-gray-900 font-semibold hover:bg-brand-gold-dark transition-colors text-base"
              >
                Ver Competencias
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {!session && (
                <LoginButton size="lg" className="bg-white/10 border border-white/30 hover:bg-white/20" />
              )}
              {session && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-colors text-base"
                >
                  Mi Perfil
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <StatItem value="20+" label="Competencias" />
            <StatItem value="200+" label="Competidores" />
            <StatItem value="2014" label="Desde" />
          </div>
        </div>
      </section>

      {/* Upcoming Competitions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Próximas Competencias</h2>
              <p className="text-gray-500 mt-1 text-sm">Competencias WCA en Uruguay</p>
            </div>
            <Link
              href="/competitions"
              className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors hidden sm:block"
            >
              Ver todas →
            </Link>
          </div>

          {upcomingComps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingComps.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-4xl mb-4">🏆</p>
              <h3 className="font-semibold text-gray-700 mb-2">
                No hay competencias próximas
              </h3>
              <p className="text-sm text-gray-500">
                Seguí nuestro Instagram <strong>@aus.uy</strong> para enterarte
                de las próximas novedades.
              </p>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/competitions"
              className="text-sm font-semibold text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              Ver todas las competencias →
            </Link>
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ¿Qué es el Speedcubing?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                El speedcubing es el deporte de resolver cubos de Rubik lo más
                rápido posible. Con eventos que van desde el clásico 3x3 hasta
                resolver con una sola mano o incluso a ciegas, hay una categoría
                para cada desafío.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                La AUS organiza competencias oficiales de la World Cube
                Association (WCA) en Uruguay, permitiéndote obtener un ID
                oficial y competir en el ranking mundial.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/members"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors text-sm font-semibold"
                >
                  Ver Miembros Uruguayos
                </Link>
                <a
                  href="https://www.instagram.com/aus.uy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                  @aus.uy en Instagram
                </a>
              </div>
            </div>

            {/* Decorative cube grid */}
            <div className="hidden lg:flex justify-center">
              <CubeDecoration />
            </div>
          </div>
        </div>
      </section>

      {/* Login CTA */}
      {!session && (
        <section className="py-16 gradient-hero text-white">
          <div className="max-w-3xl mx-auto text-center px-4 sm:px-6">
            <h2 className="text-3xl font-bold mb-4">
              Conectá tu cuenta de WCA
            </h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Iniciá sesión con tu cuenta de la World Cube Association para
              ver tu perfil, tus records personales y más.
            </p>
            <LoginButton size="lg" />
          </div>
        </section>
      )}
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl sm:text-4xl font-bold text-brand-gold">{value}</p>
      <p className="text-sm text-blue-200 mt-1">{label}</p>
    </div>
  );
}

function CubeDecoration() {
  const colors = [
    ["bg-red-500", "bg-white", "bg-blue-600"],
    ["bg-brand-gold", "bg-green-500", "bg-orange-500"],
    ["bg-blue-600", "bg-red-500", "bg-white"],
  ];

  return (
    <div className="grid grid-cols-3 gap-2 opacity-80 rotate-12">
      {colors.map((row, ri) =>
        row.map((color, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={`w-20 h-20 rounded-lg ${color} shadow-lg`}
          />
        ))
      )}
    </div>
  );
}
