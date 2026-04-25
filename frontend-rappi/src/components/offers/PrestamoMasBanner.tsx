"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

const SS_BASE_AMOUNT = "fr_base_amount";

interface Props {
  /** Monto máximo de la oferta RBF actual — es el punto de partida del flujo Préstamo MÁS. */
  baseAmount: number;
}

/**
 * Banner compacto que se muestra como **alternativa** a las 3 ofertas RBF
 * regulares. Al hacer clic guarda el baseAmount en sessionStorage para que
 * el flujo Full Revenue pueda mostrarlo como punto de partida y calcular
 * los multiplicadores 1.5x / 2x / 4x.
 */
export function PrestamoMasBanner({ baseAmount }: Props) {
  const router = useRouter();
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent(EVENTS.BANNER_VIEWED, { surface: "offers_feed" });
  }, [trackEvent]);

  function handleClick() {
    trackEvent(EVENTS.BANNER_CLICKED, { surface: "offers_feed", base_amount: baseAmount });
    sessionStorage.setItem(SS_BASE_AMOUNT, String(baseAmount));
    router.push("/full-revenue/info");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Conocer Préstamo MÁS, opción alternativa"
      className="w-full flex items-center justify-between gap-4 border-2 border-rappi-orange bg-white hover:bg-rappi-orange-light transition-colors rounded-card px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rappi-orange focus-visible:ring-offset-2"
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
            ¿Necesitas más crédito? Parte de{" "}
            <span className="text-uber-green">${baseAmount.toLocaleString("en-US")}</span> y desbloquea hasta <span className="text-uber-green">4x</span> más
          </p>
          <p className="text-[13px] text-uber-gray-700 leading-5 mt-0.5 hidden sm:block">
            Comparte tus datos fiscales y de presencia digital para acceder a
            una oferta más alta basada en el 100% de tus ingresos.
          </p>
        </div>
      </div>

      {/* CTA */}
      <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-rappi-orange whitespace-nowrap flex-shrink-0">
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
