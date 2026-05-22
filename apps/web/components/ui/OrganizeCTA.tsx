export function OrganizeCTA() {
  return (
    <section className="bg-brand-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Text */}
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700/60 mb-2">
              Organizá con la AUS
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-balance">
              ¿Querés organizar una competencia oficial?
            </h2>
            <p className="text-gray-800 leading-relaxed max-w-xl">
              La AUS acompaña a organizadores locales para realizar competencias
              homologadas por la WCA en Uruguay. Revisá los requisitos y completá
              el formulario para dar el primer paso.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
            <a
              href="https://docs.google.com/document/d/1lKjdWHiq-yYtngeurc4qnu_zrBHiYZvzqECRMXsCa88/edit?tab=t.0#heading=h.6u2py5i76y4r"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-gray-900/20 text-gray-900 text-sm font-semibold hover:bg-black/10 transition-colors"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver requisitos
            </a>
            <a
              href="https://forms.gle/eAjMiHJVwGsp3ysH8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Completar formulario
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
