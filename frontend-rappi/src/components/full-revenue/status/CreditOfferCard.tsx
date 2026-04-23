"use client";

import { useRouter } from "next/navigation";
import type { CreditOffer } from "@/types/application";

interface Props {
  offer: CreditOffer;
  basicAmount?: number;
  applicationId: string;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Porcentaje de retención sobre cada venta (15–20% según monto aprobado)
function withholdingPct(approvedAmount: number): number {
  if (approvedAmount >= 400000) return 20;
  if (approvedAmount >= 200000) return 18;
  return 15;
}

export function CreditOfferCard({ offer, basicAmount = 50000, applicationId }: Props) {
  const router = useRouter();
  const multiplier = Math.round(offer.approved_amount / basicAmount);
  const interestPct = (offer.interest_rate_monthly * 100).toFixed(1);
  const annualRate = (offer.interest_rate_monthly * 12 * 100).toFixed(0);
  const retPct = withholdingPct(offer.approved_amount);

  return (
    <div className="space-y-5">
      {/* ── Hero pre-aprobación ── */}
      <div className="relative bg-gradient-to-br from-rappi-orange to-rappi-orange-mid rounded-2xl p-6 text-white overflow-hidden shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-5 rounded-full" />
        <div className="absolute -right-2 -bottom-8 w-32 h-32 bg-white opacity-5 rounded-full" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Crédito pre-aprobado
          </div>

          <p className="text-sm opacity-80 mb-0.5">Tu oferta de crédito</p>
          <p className="text-4xl font-bold leading-tight mb-1">
            ${fmt(offer.approved_amount)}
            <span className="text-xl font-normal opacity-80 ml-1.5">{offer.currency}</span>
          </p>

          {multiplier >= 3 && (
            <div className="inline-flex items-center gap-1 bg-white bg-opacity-20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
              </svg>
              {multiplier}x más que el crédito básico
            </div>
          )}
        </div>
      </div>

      {/* ── Condiciones ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Condiciones del crédito
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">📈</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Tasa de interés</p>
                <p className="text-xs text-gray-400">Tasa mensual · {annualRate}% CAT anual</p>
              </div>
            </div>
            <span className="text-base font-bold text-gray-900">{interestPct}% mensual</span>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">📅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Plazo</p>
                <p className="text-xs text-gray-400">Cuotas mensuales</p>
              </div>
            </div>
            <span className="text-base font-bold text-gray-900">{offer.installments} meses</span>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💵</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Cuota mensual</p>
                <p className="text-xs text-gray-400">Capital + interés</p>
              </div>
            </div>
            <span className="text-base font-bold text-gray-900">${fmt(offer.monthly_payment)} MXN</span>
          </div>
        </div>
      </div>

      {/* ── Método de repago ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Método de repago
          </h3>
        </div>

        <div className="divide-y divide-gray-50">
          {/* Retención % por venta */}
          <div className="flex items-start gap-2.5 px-5 py-4">
            <div className="w-8 h-8 bg-rappi-orange-light rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">🛍️</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-medium text-gray-800">Retención sobre ventas</p>
                <span className="text-base font-bold text-rappi-orange">{retPct}% por venta</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Se retiene automáticamente el{" "}
                <span className="font-semibold text-gray-600">{retPct}% de cada liquidación</span> de tu
                cuenta Rappi hasta cubrir la cuota mensual de{" "}
                <span className="font-semibold text-gray-600">${fmt(offer.monthly_payment)} MXN</span>.
              </p>
            </div>
          </div>

          {/* Débito directo del remanente */}
          <div className="flex items-start gap-2.5 px-5 py-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">🏦</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-medium text-gray-800">Débito directo</p>
                <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">solo si hace falta</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Si las retenciones del mes no alcanzan a cubrir la cuota completa,
                el <span className="font-semibold text-gray-600">remanente se debita automáticamente</span> de
                tu cuenta bancaria registrada.
              </p>
            </div>
          </div>
        </div>

        {/* Nota motivacional */}
        <div className="px-5 pb-4">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-orange-800 leading-relaxed">
              <span className="font-semibold">Cuanto más vendas, menos debitas.</span>{" "}
              A mayor volumen en Rappi, más rápido se cubre la cuota por retención y menor será el débito mensual en cuenta.
            </p>
          </div>
        </div>
      </div>

      {/* ── Total ── */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Total a devolver</span>
          <span className="text-base font-bold text-gray-900">
            ${fmt(offer.monthly_payment * offer.installments)} MXN
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">Costo total del financiamiento</span>
          <span className="text-sm font-medium text-gray-600">
            ${fmt(offer.monthly_payment * offer.installments - offer.approved_amount)} MXN
          </span>
        </div>
      </div>

      {/* ── CTA Aplicar ── */}
      <div className="space-y-3 pb-6">
        <button
          onClick={() => router.push(`/full-revenue/kyc/${applicationId}`)}
          className="w-full bg-rappi-orange text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-orange-200 active:scale-95 transition-all duration-150 hover:bg-rappi-orange-dark focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:ring-offset-2"
        >
          Aplicar al préstamo
        </button>
        <p className="text-xs text-center text-gray-400 leading-relaxed">
          Al continuar iniciás el proceso de verificación (KYC).
          Tu oferta queda reservada por{" "}
          <span className="font-medium text-gray-500">72 horas</span>.
        </p>
      </div>
    </div>
  );
}
