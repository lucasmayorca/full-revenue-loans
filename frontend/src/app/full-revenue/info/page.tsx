"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

const INITIAL_AMOUNT = 50_000;

function fmt(n: number) {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
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

const STEPS = [
  {
    number: 1,
    title: "Buró de crédito",
    description:
      "Autorizas la consulta al buró e identidad vía Twilio. Tu oferta inicial se revela.",
    unlocks: "hasta $75k",
  },
  {
    number: 2,
    title: "Presencia digital",
    description:
      "Conectas Google Maps y redes sociales para ampliar tu monto.",
    unlocks: "hasta $100k",
  },
  {
    number: 3,
    title: "Datos fiscales",
    description:
      "Compartes tus datos del SAT para que calculemos tu capacidad real de pago.",
    unlocks: "hasta $200k",
  },
  {
    number: 4,
    title: "Oferta final",
    description: "Recibes tu monto máximo y decides si quieres aplicar.",
    unlocks: "Oferta final",
  },
];

export default function FullRevenueInfoPage() {
  const router = useRouter();
  const { trackEvent } = useTracking();
  const animatedAmount = useCountUp(INITIAL_AMOUNT, 900);

  useEffect(() => {
    trackEvent(EVENTS.PRODUCT_PAGE_VIEWED);
  }, [trackEvent]);

  function handleContinue() {
    trackEvent(EVENTS.CONTINUE_CLICKED);
    router.push("/full-revenue/apply");
  }

  return (
    <div className="max-w-[720px] mx-auto px-8 py-10 space-y-10">
      {/* Title */}
      <div>
        <p className="text-[13px] font-bold text-uber-green uppercase tracking-wider mb-3">
          Nuevo · Préstamo MÁS
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
          <p className="text-[12px] uppercase tracking-wider text-white/60 mb-2">
            Tu crédito inicial garantizado
          </p>
          <div className="flex items-end gap-2 mb-6">
            <p className="text-[56px] font-bold leading-none tracking-tight">
              ${fmt(animatedAmount)}
            </p>
            <p className="text-[18px] font-medium text-white/80 mb-1.5">
              MXN
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[12px] text-white/80">
              <span>Potencial máximo</span>
              <span className="font-bold">hasta $200,000 MXN</span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-uber-green rounded-full transition-all duration-1000"
                style={{ width: "25%" }}
              />
            </div>
            <p className="text-[12px] text-white/60">
              Completa los pasos para llegar a tu máximo.
            </p>
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
                    <p className="text-[16px] font-bold text-black">
                      {step.title}
                    </p>
                    <span className="text-[12px] font-bold text-uber-success bg-uber-success-bg px-2 py-0.5 rounded-sm whitespace-nowrap">
                      {step.unlocks}
                    </span>
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
