"use client";

import { useEffect, useState } from "react";

interface Props {
  amount: number;
  previousAmount?: number;
  stage: "bureau" | "social" | "final";
  isAnimating?: boolean;
  currency?: string;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function useCountUp(target: number, duration = 1000, startFrom = 0) {
  const [value, setValue] = useState(startFrom);
  useEffect(() => {
    if (startFrom === target) {
      setValue(target);
      return;
    }
    const range = target - startFrom;
    const steps = 50;
    const stepValue = range / steps;
    let current = startFrom;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, startFrom, duration]);
  return value;
}

/** Compute estimated credit conditions for a given amount */
function computeConditions(amount: number, stage: "bureau" | "social" | "final") {
  // Monthly rate varies by stage (better data → better rate)
  const rate = stage === "final" ? 0.030 : stage === "social" ? 0.034 : 0.038;
  const installments = 12;
  // Annuity formula
  const monthlyPayment = Math.round(
    (amount * rate) / (1 - Math.pow(1 + rate, -installments))
  );
  return {
    rate,
    installments,
    monthlyPayment,
  };
}

const STAGE_CONFIG = {
  bureau: {
    label: "¡Tu primera oferta está lista!",
    sublabel: "Basada en tu buró de crédito e historial fiscal",
    badge: "Oferta inicial",
    icon: "🎯",
    tip: "Conectá tu presencia digital para ampliar este monto.",
  },
  social: {
    label: "¡Tu oferta creció!",
    sublabel: "Gracias a tu presencia en Google Maps y redes sociales",
    badge: "Oferta ampliada",
    icon: "🚀",
    tip: "Tu presencia digital demostró la solidez de tu negocio.",
  },
  final: {
    label: "¡Esta es tu oferta máxima!",
    sublabel: "Calculada con todos tus datos disponibles",
    badge: "Oferta final",
    icon: "🏆",
    tip: "Esta es la mejor oferta posible con la información proporcionada.",
  },
};

export function OfferRevealCard({ amount, previousAmount = 0, stage, isAnimating = true, currency = "MXN" }: Props) {
  const config = STAGE_CONFIG[stage];
  const animatedAmount = useCountUp(amount, isAnimating ? 1200 : 0, isAnimating ? previousAmount : amount);
  const [showIncrease, setShowIncrease] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const increase = amount - previousAmount;
  const conditions = computeConditions(amount, stage);

  useEffect(() => {
    if (isAnimating && increase > 0) {
      const t = setTimeout(() => setShowIncrease(true), 400);
      return () => clearTimeout(t);
    }
  }, [isAnimating, increase]);

  return (
    <div className="space-y-4">
      {/* Badge animado de incremento */}
      {increase > 0 && showIncrease && (
        <div className="flex justify-center animate-bounce-once">
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-4 py-2 rounded-full shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
            +${fmt(increase)} MXN desbloqueados
          </div>
        </div>
      )}

      {/* Card principal — unified orange gradient for all stages */}
      <div className="relative bg-gradient-to-br from-rappi-orange to-rappi-orange-mid rounded-3xl p-7 text-white overflow-hidden shadow-2xl">
        {/* Círculos decorativos */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-5 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-32 h-32 bg-white opacity-5 rounded-full" />
        <div className="absolute left-1/2 bottom-0 w-64 h-20 bg-white opacity-[0.03] rounded-full blur-xl" />

        <div className="relative">
          {/* Stage badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">{config.icon}</span>
            <div className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {config.badge}
            </div>
          </div>

          {/* Label */}
          <p className="text-xl font-bold mb-0.5">{config.label}</p>
          <p className="text-sm opacity-75 mb-5">{config.sublabel}</p>

          {/* Monto principal animado */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Tu oferta de crédito</p>
            <div className="flex items-end gap-2">
              <p className="text-5xl font-black leading-none tracking-tight">
                ${fmt(animatedAmount)}
              </p>
              <p className="text-xl font-medium opacity-80 mb-1">{currency}</p>
            </div>
          </div>

          {/* Nota por stage */}
          {stage === "social" && (
            <div className="bg-white bg-opacity-15 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-bold">✅ Oferta ampliada con datos digitales</p>
              <p className="text-xs opacity-75 mt-0.5">Calculada con tu buró + presencia digital</p>
            </div>
          )}

          {stage === "final" && (
            <div className="bg-white bg-opacity-15 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-bold">✅ Oferta máxima alcanzada</p>
              <p className="text-xs opacity-75 mt-0.5">Calculada con todos tus datos: buró + digital + fiscal</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible credit conditions */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowConditions((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <p className="text-sm font-semibold text-gray-800">Condiciones del crédito</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showConditions ? "rotate-180" : ""}`}
            viewBox="0 0 20 20" fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>

        {showConditions && (
          <div className="px-4 pb-4 space-y-2.5 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tasa de interés</span>
              <span className="text-xs font-semibold text-gray-800">{(conditions.rate * 100).toFixed(1)}% mensual</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Plazo</span>
              <span className="text-xs font-semibold text-gray-800">{conditions.installments} meses</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Cuota mensual mínima</span>
              <span className="text-xs font-semibold text-gray-800">${fmt(conditions.monthlyPayment)} {currency}</span>
            </div>
            <div className="border-t border-gray-100 pt-2.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Método de repago</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">🛒</span>
                  <div>
                    <p className="text-xs font-bold text-gray-700">Retención Rappi — 20% de tus ventas</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                      Se retiene automáticamente el 20% de tus ventas en Rappi hasta cubrir la cuota del mes.
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">🏦</span>
                  <div>
                    <p className="text-xs font-bold text-gray-700">Débito directo — remanente</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                      Si la retención no cubre la cuota mínima del mes, el saldo pendiente se cobra por débito directo de tu cuenta bancaria.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
              * Condiciones estimadas sujetas a aprobación final. La tasa puede variar según tu perfil crediticio.
            </p>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-base flex-shrink-0">💡</span>
        <p className="text-xs text-gray-600 leading-relaxed">{config.tip}</p>
      </div>
    </div>
  );
}
