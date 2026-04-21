"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

export function PrestamoMasBanner() {
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
    <section
      className="relative bg-black text-white rounded-card overflow-hidden"
      aria-label="Préstamo MÁS — Producto nuevo"
    >
      {/* Acentos decorativos */}
      <div
        aria-hidden
        className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-uber-green opacity-10"
      />
      <div
        aria-hidden
        className="absolute -right-6 -bottom-10 w-48 h-48 rounded-full bg-white opacity-[0.04]"
      />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 md:p-10">
        {/* Izquierda: copy */}
        <div className="flex-1 max-w-[620px]">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 bg-uber-green text-black font-bold text-[12px] uppercase tracking-wider px-2.5 py-1 rounded-sm">
              Nuevo
            </span>
            <span className="text-[13px] text-white/70 font-medium uppercase tracking-wider">
              Préstamo MÁS
            </span>
          </div>

          <h2 className="text-[28px] md:text-[32px] font-bold leading-[1.15] mb-3">
            Desbloquea hasta <span className="text-uber-green">4x más crédito</span>{" "}
            compartiendo el 100% de tus ingresos.
          </h2>

          <p className="text-[16px] leading-6 text-white/80 mb-5">
            Comparte tus datos fiscales, bancarios y de presencia digital para
            acceder a una oferta de préstamo personalizada basada en el total de
            las ventas de tu negocio, no solo las de Uber Eats.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 text-[14px]">
            <li className="flex items-center gap-2 text-white/90">
              <CheckIcon />
              Hasta $200,000 MXN
            </li>
            <li className="flex items-center gap-2 text-white/90">
              <CheckIcon />
              Evaluación en minutos
            </li>
            <li className="flex items-center gap-2 text-white/90">
              <CheckIcon />
              Sin visitas ni papeleo
            </li>
          </ul>

          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-2 bg-white text-black font-bold text-[16px] h-12 px-6 rounded-btn hover:bg-uber-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-uber-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Ver mi oferta
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
          </button>
        </div>

        {/* Derecha: ilustración */}
        <div className="relative hidden md:flex items-center justify-center w-[280px] h-[200px] flex-shrink-0">
          <div className="absolute inset-0 rounded-card border border-white/10 bg-white/[0.03]" />
          <div className="relative text-center">
            <div className="text-[12px] font-medium uppercase tracking-wider text-white/60 mb-2">
              Oferta base Uber Eats
            </div>
            <div className="text-[28px] font-bold text-white/50 line-through mb-2">
              $62,800
            </div>
            <div className="w-12 h-px bg-white/20 mx-auto mb-2" />
            <div className="text-[12px] font-medium uppercase tracking-wider text-uber-green mb-1">
              Con Préstamo MÁS
            </div>
            <div className="text-[40px] font-bold leading-none text-white">
              $200k
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-uber-green flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
