"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

const SS_BASE_AMOUNT = "fr_base_amount";
const FALLBACK_BASE  = 50_000;

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    const steps = 40;
    const step = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration]);
  return value;
}

export default function FullRevenueInfoPage() {
  const router = useRouter();
  const { trackEvent } = useTracking();

  const [baseAmount, setBaseAmount] = useState(FALLBACK_BASE);

  useEffect(() => {
    const stored = sessionStorage.getItem(SS_BASE_AMOUNT);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) setBaseAmount(parsed);
    }
    trackEvent(EVENTS.PRODUCT_PAGE_VIEWED);
  }, [trackEvent]);

  const bureauOffer = Math.round(baseAmount * 1.5);
  const socialOffer = Math.round(baseAmount * 2);
  const fiscalOffer = Math.round(baseAmount * 4);

  const animatedBase = useCountUp(baseAmount, 900);

  function handleContinue() {
    trackEvent(EVENTS.CONTINUE_CLICKED);
    router.push("/full-revenue/apply");
  }

  const STEPS = [
    {
      number: 1,
      title: "Buró de crédito",
      description: "Autorizas la consulta al buró e identidad vía Twilio. Tu oferta inicial se revela.",
      unlocks: `hasta $${fmt(bureauOffer)}`,
      mult: "1.5x",
    },
    {
      number: 2,
      title: "Presencia digital",
      description: "Conectas Google Maps y redes sociales para ampliar tu monto.",
      unlocks: `hasta $${fmt(socialOffer)}`,
      mult: "2x",
    },
    {
      number: 3,
      title: "Datos fiscales",
      description: "Compartes tus datos del SAT para que calculemos tu capacidad real de pago.",
      unlocks: `hasta $${fmt(fiscalOffer)}`,
      mult: "4x",
    },
  ];

  return (
    <div className="max-w-[720px] mx-auto px-8 py-10 space-y-10">
      {/* Title */}
      <div>
        <p className="text-[13px] font-bold text-uber-green uppercase tracking-wider mb-3">
          Nuevo · Financiamiento MÁS
        </p>
        <h1 className="text-[40px] leading-[1.1] font-bold text-black mb-3 tracking-tight">
          Desbloquea hasta 4x más crédito basado en el 100% de tus ingresos.
        </h1>
        <p className="text-[16px] leading-6 text-uber-gray-700">
          Evaluamos tus datos fiscales, tus ventas en Uber Eats y tu presencia
          digital para calcular una oferta personalizada. Proceso guiado,
          menos de 3 minutos.
        </p>
      </div>

      {/* Hero card */}
      <div className="relative bg-black text-white rounded-card p-8 overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 w-72 h-72 bg-uber-green opacity-10 rounded-full"
        />
        <div className="relative">
          <p className="text-[12px] uppercase tracking-wider text-white/60 mb-1">
            Tu oferta actual
          </p>
          <div className="flex items-end gap-2 mb-1">
            <p className="text-[56px] font-bold leading-none tracking-tight">
              ${fmt(animatedBase)}
            </p>
            <p className="text-[18px] font-medium text-white/80 mb-1.5">MXN</p>
          </div>
          <p className="text-[13px] text-white/50 mb-6">
            Punto de partida — puede crecer hasta ${fmt(fiscalOffer)} MXN
          </p>

          {/* Mini milestone bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">Oferta base</span>
              <span className="text-white/60">→</span>
              <span className="text-uber-green font-bold">Máximo ${fmt(fiscalOffer)}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-white/40 rounded-full" style={{ width: "25%" }} />
              <div className="h-full border-l border-white/20" title={`$${fmt(bureauOffer)}`} style={{ marginLeft: "12.5%" }} />
              <div className="h-full border-l border-white/20" title={`$${fmt(socialOffer)}`} style={{ marginLeft: "12.5%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/40">
              <span>${fmt(baseAmount)}</span>
              <span>${fmt(bureauOffer)}</span>
              <span>${fmt(socialOffer)}</span>
              <span>${fmt(fiscalOffer)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-h2 text-black mb-5">Cómo crece tu crédito</h2>

        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative">
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-[23px] top-12 bottom-0 w-px bg-uber-gray-300 z-0"
                />
              )}

              <div className="relative z-10 flex items-start gap-4">
                <div className="w-12 h-12 bg-black text-white rounded-card flex items-center justify-center flex-shrink-0 font-bold text-[18px]">
                  {step.number}
                </div>

                <div className="flex-1 bg-white border border-uber-gray-200 rounded-card px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[16px] font-bold text-black">{step.title}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold text-uber-gray-500 bg-uber-gray-100 px-1.5 py-0.5 rounded-sm">
                        {step.mult}
                      </span>
                      <span className="text-[12px] font-bold text-uber-success bg-uber-success-bg px-2 py-0.5 rounded-sm whitespace-nowrap">
                        {step.unlocks}
                      </span>
                    </div>
                  </div>
                  <p className="text-[14px] text-uber-gray-700 leading-5">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-4">
        <Button onClick={handleContinue} size="lg">
          Continuar
        </Button>
        <p className="text-[12px] text-uber-gray-500 leading-5">
          Sin compromiso. Puedes aplicar o no al final del proceso. El proceso
          toma menos de 3 minutos.
        </p>
      </div>
    </div>
  );
}
