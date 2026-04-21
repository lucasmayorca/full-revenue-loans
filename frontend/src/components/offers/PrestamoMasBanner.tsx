"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

/**
 * Banner compacto que se muestra como **alternativa** a las 3 ofertas RBF
 * regulares. Layout horizontal en una sola fila (~80-100px de alto) para
 * no competir visualmente con las cards principales y dejar que el usuario
 * entienda que el default es aplicar a alguna de las 3 ofertas, y que
 * Préstamo MÁS es una opción extra para acceder a montos más altos.
 */
export function PrestamoMasBanner() {
  const router = useRouter();
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent(EVENTS.BANNER_VIEWED, { surface: "offers_feed" });
  }, [trackEvent]);

  function handleClick() {
    trackEvent(EVENTS.BANNER_CLICKED, { surface: "offers_feed" });
    router.push("/full-revenue/info");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Conocer Préstamo MÁS, opción alternativa"
      className="w-full flex items-center justify-between gap-4 border-2 border-black bg-white hover:bg-uber-gray-100 transition-colors rounded-card px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Icono verde */}
        <div className="w-10 h-10 rounded-card bg-uber-green flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-black"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M13 2L4.09 12.97l1.91.03H11l-1 9 9-11h-6l1-9z" />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[11px] font-bold text-uber-gray-500 uppercase tracking-wider">
              Opción alternativa · Nuevo
            </span>
          </div>
          <p className="text-[16px] font-bold text-black leading-5">
            ¿Necesitas más crédito? Desbloquea hasta{" "}
            <span className="text-uber-green">4x más</span> con Préstamo MÁS
          </p>
          <p className="text-[13px] text-uber-gray-700 leading-5 mt-0.5 hidden sm:block">
            Comparte tus datos fiscales y de presencia digital para acceder a
            una oferta más alta basada en el 100% de tus ingresos.
          </p>
        </div>
      </div>

      {/* CTA */}
      <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-black whitespace-nowrap flex-shrink-0">
        Conocer más
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </span>
    </button>
  );
}
