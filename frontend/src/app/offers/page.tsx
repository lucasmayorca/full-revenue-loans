import { FullRevenueBanner } from "@/components/offers/FullRevenueBanner";

export default function OffersPage() {
  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-rappi-muted mb-6">
        <span>Inicio</span>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-rappi-dark font-medium">Créditos</span>
      </nav>

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-rappi-dark mb-1">
          Crédito para tu negocio
        </h1>
        <p className="text-rappi-muted">
          Elige la opción que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Grid de productos crediticios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {/* Card 1 — Préstamo Básico */}
        <div className="bg-white rounded-2xl border border-rappi-card-border shadow-sm p-6 flex flex-col h-full">
          {/* Ícono */}
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>

          {/* Tag */}
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
            Préstamo Básico
          </span>

          {/* Monto preaprobado */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1 mb-0.5">
              <p className="text-3xl font-bold text-rappi-dark">
                $50,000
                <span className="text-lg font-normal text-rappi-muted ml-1">MXN</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Preaprobado para vos
              </span>
            </div>
          </div>

          {/* Características */}
          <ul className="space-y-2 mb-6 flex-1">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Basado en tus ventas en Rappi
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Aprobación en 24 hs
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sin trámites adicionales
            </li>
          </ul>

          {/* CTA */}
          <button className="w-full py-3 rounded-xl border-2 border-rappi-card-border text-rappi-dark font-semibold text-sm hover:border-gray-400 transition-colors">
            Ver detalles
          </button>
        </div>

        {/* Card 2 — Préstamo MÁS (banner destacado) */}
        <FullRevenueBanner />

        {/* Card 3 — Capital de trabajo (próximamente) */}
        <div className="bg-white rounded-2xl border border-rappi-card-border shadow-sm p-6 flex flex-col h-full opacity-60">
          {/* Ícono */}
          <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>

          {/* Tag */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Capital de Trabajo
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              Próximamente
            </span>
          </div>

          {/* Monto */}
          <p className="text-3xl font-bold text-gray-400 mb-1">
            $200,000
            <span className="text-lg font-normal text-gray-400 ml-1">MXN</span>
          </p>
          <p className="text-sm text-gray-400 mb-4">Monto máximo estimado</p>

          {/* Características */}
          <ul className="space-y-2 mb-6 flex-1">
            <li className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Para inventario y expansión
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Plazos flexibles hasta 24 meses
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Tasas preferenciales
            </li>
          </ul>

          {/* CTA deshabilitado */}
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-not-allowed"
          >
            Disponible pronto
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">¿Necesitás más crédito?</p>
          <p className="text-sm text-blue-600 mt-0.5">
            Con <strong>Préstamo MÁS</strong> podés acceder a hasta 5 veces más financiamiento conectando tus datos fiscales y plataformas digitales.
          </p>
        </div>
      </div>
    </div>
  );
}
