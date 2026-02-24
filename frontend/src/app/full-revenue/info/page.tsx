"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

const INITIAL_AMOUNT = 50_000;

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Animated counter hook
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
    icon: "📋",
    title: "Buró de crédito",
    description: "Autorizás la consulta al buró e identidad vía Twilio. Tu oferta inicial se revela.",
    unlocks: "1.5X",
    color: "bg-orange-50",
    textColor: "text-orange-700",
  },
  {
    number: 2,
    icon: "📍",
    title: "Presencia digital",
    description: "Conectás Google Maps y redes sociales para ampliar tu monto.",
    unlocks: "2X",
    color: "bg-orange-50",
    textColor: "text-orange-700",
  },
  {
    number: 3,
    icon: "🏛️",
    title: "Datos fiscales",
    description: "Compartís tus datos del SAT para que calculemos tu capacidad real de pago.",
    unlocks: "4X",
    color: "bg-orange-50",
    textColor: "text-orange-700",
  },
  {
    number: 4,
    icon: "🎉",
    title: "Oferta final",
    description: "Recibís tu monto máximo y decidís si querés aplicar.",
    unlocks: "Oferta final",
    color: "bg-orange-50",
    textColor: "text-orange-700",
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
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">

      {/* ── Hero: monto que crece ── */}
      <div className="relative bg-gradient-to-br from-rappi-orange to-rappi-orange-mid rounded-3xl p-7 text-white overflow-hidden shadow-xl">
        {/* Círculos decorativos */}
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-white opacity-5 rounded-full" />
        <div className="absolute -right-4 -bottom-10 w-36 h-36 bg-white opacity-5 rounded-full" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            ✨ Préstamo MÁS — Pre-aprobado para vos
          </div>

          <p className="text-sm opacity-80 mb-1">Tu crédito inicial garantizado</p>
          <p className="text-5xl font-black leading-none mb-1">
            ${fmt(animatedAmount)}
          </p>
          <p className="text-base font-medium opacity-80 mb-5">MXN</p>

          {/* Barra de progreso del potencial */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-80">
              <span>Potencial máximo</span>
              <span className="font-semibold">hasta 4X tu ingreso</span>
            </div>
            <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: "25%" }}
              />
            </div>
            <p className="text-xs opacity-70 text-center">
              Completá los pasos para llegar a tu máximo
            </p>
          </div>
        </div>
      </div>

      {/* ── Pasos con unlock de monto ── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Cómo crece tu crédito
        </p>

        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative">
              {/* Línea conectora */}
              {idx < STEPS.length - 1 && (
                <div className="absolute left-[19px] top-11 bottom-0 w-0.5 bg-gray-100 z-0" />
              )}

              <div className="relative z-10 flex gap-3.5">
                {/* Número / icono */}
                <div className={`w-10 h-10 ${step.color} rounded-2xl flex items-center justify-center flex-shrink-0 text-lg`}>
                  {step.icon}
                </div>

                {/* Contenido */}
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                    <span className={`text-xs font-bold ${step.textColor} ${step.color} px-2 py-0.5 rounded-full whitespace-nowrap`}>
                      {step.unlocks}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="pb-6 space-y-3">
        <Button onClick={handleContinue} fullWidth size="lg">
          Ver mi oferta →
        </Button>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Sin compromiso. Podés aplicar o no al final del proceso.
          El proceso toma menos de 3 minutos.
        </p>
      </div>
    </div>
  );
}
