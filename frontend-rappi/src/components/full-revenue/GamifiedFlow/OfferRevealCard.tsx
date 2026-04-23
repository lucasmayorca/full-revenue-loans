"use client";

import { useEffect, useState } from "react";

interface Props {
  amount: number;
  previousAmount?: number;
  /** Monto base inicial (Rappi estándar) — se usa en stage="final" para mostrar mejora total */
  baseAmount?: number;
  stage: "bureau" | "social" | "final";
  isAnimating?: boolean;
  currency?: string;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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

/** Calcula condiciones de crédito estimadas */
function computeConditions(amount: number, stage: "bureau" | "social" | "final") {
  // Tasa mensual varía por stage (mejores datos → mejor tasa)
  const rate = stage === "final" ? 0.03 : stage === "social" ? 0.034 : 0.038;
  const installments = 12;
  // Fórmula de anualidad
  const monthlyPayment = Math.round(
    (amount * rate) / (1 - Math.pow(1 + rate, -installments))
  );
  const totalToPay = monthlyPayment * installments;
  const totalInterest = totalToPay - amount;
  return {
    rate,
    installments,
    monthlyPayment,
    totalToPay,
    totalInterest,
  };
}

const STAGE_CONFIG = {
  bureau: {
    label: "Tu primera oferta está lista",
    sublabel: "Basada en tu buró de crédito e historial fiscal",
    badge: "Oferta inicial",
  },
  social: {
    label: "Tu oferta creció",
    sublabel: "Gracias a tu presencia en Google Maps y redes sociales",
    badge: "Oferta ampliada",
  },
  final: {
    label: "Esta es tu oferta máxima",
    sublabel: "Calculada con todos tus datos disponibles",
    badge: "Oferta final",
  },
};

export function OfferRevealCard({
  amount,
  previousAmount = 0,
  baseAmount,
  stage,
  isAnimating = true,
  currency = "MXN",
}: Props) {
  const config = STAGE_CONFIG[stage];
  const animatedAmount = useCountUp(
    amount,
    isAnimating ? 1200 : 0,
    isAnimating ? previousAmount : amount
  );
  const [showIncrease, setShowIncrease] = useState(false);
  // Condiciones del crédito — expandidas por defecto
  const [showConditions, setShowConditions] = useState(true);
  const increase = amount - previousAmount;
  const conditions = computeConditions(amount, stage);

  // Mejora total vs base (solo relevante en "final")
  const totalImprovement =
    baseAmount !== undefined ? amount - baseAmount : 0;
  const totalImprovementPct =
    baseAmount && baseAmount > 0
      ? Math.round((totalImprovement / baseAmount) * 100)
      : 0;

  useEffect(() => {
    if (isAnimating && increase > 0) {
      const t = setTimeout(() => setShowIncrease(true), 400);
      return () => clearTimeout(t);
    }
  }, [isAnimating, increase]);

  return (
    <div className="space-y-4">
      {/* Badge animado de incremento (bureau / social) */}
      {increase > 0 && showIncrease && stage !== "final" && (
        <div className="flex justify-center animate-bounce-once">
          <div className="inline-flex items-center gap-1.5 bg-uber-success-bg border border-uber-success/30 text-uber-success text-[14px] font-bold px-4 py-2 rounded-pill">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            +${fmt(increase)} MXN desbloqueados
          </div>
        </div>
      )}

      {/* Card principal — Uber black with green accent */}
      <div className="relative bg-black rounded-card p-7 text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-16 -top-16 w-60 h-60 bg-uber-green opacity-10 rounded-full"
        />
        <div
          aria-hidden
          className="absolute -right-4 -bottom-10 w-40 h-40 bg-white opacity-[0.03] rounded-full"
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="inline-flex items-center gap-1.5 bg-uber-green text-black text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
              {config.badge}
            </div>
          </div>

          <p className="text-[22px] font-bold leading-7 mb-1">{config.label}</p>
          <p className="text-[14px] text-white/70 mb-6">{config.sublabel}</p>

          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-wider text-white/60 mb-2">
              Tu oferta de crédito
            </p>
            <div className="flex items-end gap-2">
              <p className="text-[56px] font-bold leading-none tracking-tight">
                ${fmt(animatedAmount)}
              </p>
              <p className="text-[18px] font-medium text-white/80 mb-1.5">
                {currency}
              </p>
            </div>
          </div>

          {/* En stage final: mostrar mejora total vs base */}
          {stage === "final" && baseAmount !== undefined && totalImprovement > 0 && (
            <div className="bg-uber-green/15 border border-uber-green/30 rounded-card px-4 py-3 mb-3">
              <p className="text-[12px] uppercase tracking-wider text-uber-green mb-1.5 font-bold">
                Mejora total desde tu oferta inicial
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[28px] font-bold text-white leading-none">
                  +${fmt(totalImprovement)}
                </span>
                <span className="text-[14px] text-white/80">MXN</span>
                <span className="text-[14px] font-bold text-uber-green">
                  +{totalImprovementPct}%
                </span>
              </div>
              <p className="text-[12px] text-white/70 mt-2">
                Pasaste de ${fmt(baseAmount)} a ${fmt(amount)} compartiendo
                tus datos digitales y fiscales.
              </p>
            </div>
          )}

          {stage === "social" && (
            <div className="bg-white/10 border border-white/10 rounded-card px-4 py-3">
              <p className="text-[14px] font-bold">
                Oferta ampliada con datos digitales
              </p>
              <p className="text-[12px] text-white/70 mt-0.5">
                Calculada con tu buró + presencia digital.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Condiciones del crédito — expandidas por defecto, collapsibles */}
      <div className="bg-white border border-uber-gray-200 rounded-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowConditions((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-uber-gray-100 transition-colors focus:outline-none"
          aria-expanded={showConditions}
        >
          <p className="text-[16px] font-bold text-black">
            Condiciones del crédito
          </p>
          <svg
            className={`w-5 h-5 text-black transition-transform duration-200 ${
              showConditions ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {showConditions && (
          <div className="px-4 pb-4 border-t border-uber-gray-200">
            <div className="flex flex-col">
              <DetailRow
                label="Monto a recibir"
                value={`$${fmt(amount)} ${currency}`}
                emphasis
              />
              <DetailRow
                label="Tasa de interés"
                value={`${(conditions.rate * 100).toFixed(1)}% mensual`}
              />
              <DetailRow
                label="Plazo"
                value={`${conditions.installments} meses`}
              />
              <DetailRow
                label="Intereses totales"
                value={`$${fmt(conditions.totalInterest)} ${currency}`}
              />
              <DetailRow
                label="Cuota mensual mínima"
                value={`$${fmt(conditions.monthlyPayment)} ${currency}`}
              />
              <DetailRow
                label="Monto total a pagar"
                value={`$${fmt(conditions.totalToPay)} ${currency}`}
                emphasis
                isLast
              />
            </div>

            {/* Método de repago */}
            <div className="mt-4 pt-4 border-t border-uber-gray-200">
              <p className="text-[12px] font-bold text-uber-gray-500 uppercase tracking-wider mb-2">
                Método de repago
              </p>
              <div className="bg-uber-gray-100 rounded-card p-3 space-y-3">
                <div className="flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 mt-0.5 text-black" fill="currentColor">
                    <path d="M18.6 7.62L17 6l-8 8-3-3-1.59 1.59L9 17.17z M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-bold text-black">
                      Retención Rappi — 20% de tus ventas
                    </p>
                    <p className="text-[12px] text-uber-gray-700 leading-5 mt-0.5">
                      Se retiene automáticamente el 20% de tus ventas en Uber
                      Eats hasta cubrir la cuota del mes.
                    </p>
                  </div>
                </div>
                <div className="border-t border-uber-gray-300 pt-3 flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 mt-0.5 text-black" fill="currentColor">
                    <path d="M6.5 10h-2v7h2v-7zm6 0h-2v7h2v-7zm8.5 9H2v2h19v-2zm-2.5-9h-2v7h2v-7zM11.5 1L2 6v2h19V6l-9.5-5z" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-bold text-black">
                      Débito directo — remanente
                    </p>
                    <p className="text-[12px] text-uber-gray-700 leading-5 mt-0.5">
                      Si la retención no cubre la cuota mínima, el saldo
                      pendiente se cobra por débito directo de tu cuenta
                      bancaria.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-uber-gray-500 leading-4 mt-3">
              * Condiciones estimadas sujetas a aprobación final. La tasa puede
              variar según tu perfil crediticio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasis,
  isLast,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between py-2.5",
        isLast ? "" : "border-b border-uber-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "text-[14px]",
          emphasis ? "font-bold text-black" : "text-uber-gray-700",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "text-[14px] text-right",
          emphasis ? "font-bold text-black" : "font-medium text-black",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
