export function InfoHero() {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-rappi-orange"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Más crédito, más posibilidades
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Evaluamos tu ingreso total — ventas en Rappi y fuera de la plataforma
        — para darte hasta <strong>5 veces más monto</strong> que con el
        préstamo básico.
      </p>
    </div>
  );
}
