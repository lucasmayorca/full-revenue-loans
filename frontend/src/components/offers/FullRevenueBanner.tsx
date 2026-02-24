"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

export function FullRevenueBanner() {
  const router = useRouter();
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent(EVENTS.BANNER_VIEWED);
  }, [trackEvent]);

  function handleClick() {
    trackEvent(EVENTS.BANNER_CLICKED);
    router.push("/full-revenue/info");
  }

  return (
    <button
      onClick={handleClick}
      className="w-full h-full bg-gradient-to-br from-rappi-orange to-rappi-orange-mid text-white rounded-2xl p-6 text-left shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rappi-orange flex flex-col relative overflow-hidden"
      aria-label="Conocer más sobre Préstamo MÁS"
    >
      {/* Fondo decorativo: círculo grande */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white opacity-5 rounded-full" />
      <div className="absolute -right-2 -bottom-6 w-28 h-28 bg-white opacity-5 rounded-full" />

      {/* Header: ícono + badge NUEVO */}
      <div className="flex items-start justify-between mb-4">
        {/* Ícono ⚡ */}
        <div className="w-11 h-11 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
          </svg>
        </div>

        {/* Badge NUEVO */}
        <span className="text-xs font-bold bg-white bg-opacity-25 text-white px-2.5 py-1 rounded-full uppercase tracking-wide">
          NUEVO
        </span>
      </div>

      {/* Tag label */}
      <p className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-2">
        Préstamo MÁS
      </p>

      {/* Headline sin monto fijo */}
      <p className="text-2xl font-bold leading-tight mb-1">
        Crédito ampliado
      </p>
      <p className="text-base font-semibold opacity-90 mb-2">
        basado en tus ingresos reales
      </p>

      {/* Descripción */}
      <p className="text-sm opacity-75 leading-relaxed flex-1">
        Conectá tus datos fiscales y plataformas digitales. Calculamos tu oferta personalizada en minutos.
      </p>

      {/* Características rápidas */}
      <ul className="mt-4 space-y-1.5 mb-5">
        <li className="flex items-center gap-2 text-sm opacity-90">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Multiplicá el monto de tu crédito
        </li>
        <li className="flex items-center gap-2 text-sm opacity-90">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Conectá tus aplicaciones digitales
        </li>
        <li className="flex items-center gap-2 text-sm opacity-90">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Evaluación en minutos
        </li>
      </ul>

      {/* CTA botón */}
      <div className="mt-auto bg-white text-rappi-orange font-bold text-sm rounded-xl py-3 px-4 text-center hover:bg-opacity-95 transition-colors flex items-center justify-center gap-1.5">
        Conocer más
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </button>
  );
}
