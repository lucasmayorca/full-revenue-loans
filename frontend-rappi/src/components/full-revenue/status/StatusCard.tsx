import type { Application, DecisionStatus } from "@/types/application";
import { StatusBadge } from "./StatusBadge";
import { CreditOfferCard } from "./CreditOfferCard";

// Copia para estados no-aprobados
const NON_APPROVED_COPY: Partial<Record<DecisionStatus, { title: string; description: string; icon: string }>> = {
  REJECTED: {
    title: "Solicitud no aprobada",
    description:
      "Por el momento no podemos aprobar tu solicitud. Podés volver a intentarlo en 90 días o contactar a soporte para más información.",
    icon: "❌",
  },
};

interface Props {
  application: Application;
}

export function StatusCard({ application }: Props) {
  const { decision_status, decision_payload } = application;
  const isPending = decision_status === "UNDERWRITING_PENDING";

  // APROBADO o EN REVISIÓN → mostrar oferta
  const isApproved =
    decision_status === "APPROVED" || decision_status === "MANUAL_REVIEW";

  // Oferta de crédito: usar la del payload o generar una simulada basada en total_revenue
  const creditOffer = (() => {
    if (decision_payload?.credit_offer) return decision_payload.credit_offer;
    if (isApproved && decision_payload) {
      const base = decision_payload.total_revenue > 0
        ? decision_payload.total_revenue
        : 30000;
      const approved = Math.round(base * 4.5 / 1000) * 1000; // 4.5x total_revenue redondeado
      const rate = 0.034;
      const months = 12;
      const monthly = Math.round((approved * rate) / (1 - Math.pow(1 + rate, -months)));
      const withholding = Math.round(monthly * 0.7);
      return {
        approved_amount: approved,
        interest_rate_monthly: rate,
        installments: months,
        monthly_payment: monthly,
        withholding_amount: withholding,
        direct_debit_amount: monthly - withholding,
        currency: "MXN",
      };
    }
    return null;
  })();

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <StatusBadge status={decision_status} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Analizando tu solicitud</h2>
          <p className="text-gray-600 leading-relaxed">
            Estamos evaluando tus ingresos y datos. El proceso suele tomar menos de 2 minutos.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Actualizando automáticamente cada 5 segundos...
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Ref: {application.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    );
  }

  if (decision_status === "REJECTED") {
    const copy = NON_APPROVED_COPY.REJECTED!;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">{copy.icon}</div>
          <StatusBadge status={decision_status} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">{copy.title}</h2>
          <p className="text-gray-600 leading-relaxed">{copy.description}</p>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Ref: {application.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    );
  }

  // APPROVED o MANUAL_REVIEW → mostrar oferta de crédito
  return (
    <div className="space-y-5">
      {/* Oferta de crédito */}
      {creditOffer ? (
        <CreditOfferCard offer={creditOffer} basicAmount={50000} applicationId={application.id} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <StatusBadge status={decision_status} />
          <p className="text-gray-600 mt-4">
            Tu solicitud fue recibida. Te informaremos el resultado por email.
          </p>
        </div>
      )}

      {/* Datos recopilados — colapsable */}
      {decision_payload && (
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
          <summary className="px-5 py-4 text-sm font-medium text-gray-500 cursor-pointer flex items-center justify-between select-none hover:bg-gray-50 transition-colors">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              Ver datos evaluados
            </span>
            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>

          <div className="px-5 pb-5 pt-1 space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide pb-1">
              Datos recopilados para la evaluación
            </p>

            {/* Ventas SAT */}
            {decision_payload.syntage_monthly_revenue > 0 && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>🏛️</span> Ventas SAT (Syntage)
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  ${decision_payload.syntage_monthly_revenue.toLocaleString("es-MX")} MXN/mes
                </span>
              </div>
            )}

            {/* Score Buró */}
            {decision_payload.bureau_score !== undefined && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>📋</span> Score Buró de Crédito
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {decision_payload.bureau_score}/850
                </span>
              </div>
            )}

            {/* GMV Rappi */}
            {decision_payload.platform_gmv_6m !== undefined && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>🛍️</span> GMV en Rappi (últ. 6m)
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  ${decision_payload.platform_gmv_6m.toLocaleString("es-MX")} MXN/mes
                </span>
              </div>
            )}

            {/* Rating Google */}
            {decision_payload.places_rating !== undefined && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>⭐</span> Rating Google
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {decision_payload.places_rating.toFixed(1)}★
                  {decision_payload.places_review_count !== undefined && (
                    <span className="text-gray-400 font-normal ml-1">
                      ({decision_payload.places_review_count} reseñas)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Score Google */}
            {decision_payload.places_signals_score > 0 && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>📊</span> Score digital Google
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {decision_payload.places_signals_score}/100
                </span>
              </div>
            )}

            {/* Facebook */}
            {decision_payload.facebook_fan_count !== undefined && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-600 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook — Seguidores
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {decision_payload.facebook_fan_count.toLocaleString("es-MX")}
                  {decision_payload.facebook_rating !== undefined && (
                    <span className="text-gray-400 font-normal ml-1">
                      · {decision_payload.facebook_rating.toFixed(1)}★
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Instagram */}
            {decision_payload.instagram_followers !== undefined && (
              <div className="flex items-center justify-between bg-pink-50 rounded-lg px-3 py-2">
                <span className="text-xs text-pink-600 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                    <defs>
                      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F58529"/>
                        <stop offset="50%" stopColor="#DD2A7B"/>
                        <stop offset="100%" stopColor="#515BD4"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Instagram — Seguidores
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {decision_payload.instagram_followers.toLocaleString("es-MX")}
                  {decision_payload.instagram_media_count !== undefined && (
                    <span className="text-gray-400 font-normal ml-1">
                      · {decision_payload.instagram_media_count} posts
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Twilio */}
            {(decision_payload.twilio_identity_match === true ||
              decision_payload.twilio_whatsapp_business === true ||
              decision_payload.twilio_sim_swap_detected === true) && (
              <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                <span className="text-xs text-indigo-600 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#F22F46">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4a8 8 0 110 16A8 8 0 0112 4zm-1 4v4.586l3.707 3.707-1.414 1.414L9 13.414V8h2z"/>
                  </svg>
                  Verificación Twilio
                </span>
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  {decision_payload.twilio_identity_match && (
                    <span className="text-green-600 font-medium">Identidad ✓</span>
                  )}
                  {decision_payload.twilio_whatsapp_business && (
                    <span className="text-green-600 font-medium">WhatsApp ✓</span>
                  )}
                  {decision_payload.twilio_sim_swap_detected && (
                    <span className="text-red-500 font-medium">SIM swap ⚠️</span>
                  )}
                </span>
              </div>
            )}

            {/* Total ponderado */}
            {decision_payload.total_revenue > 0 && (
              <div className="flex items-center justify-between bg-rappi-orange-light rounded-lg px-3 py-2 border border-orange-100">
                <span className="text-xs text-rappi-orange font-medium flex items-center gap-1.5">
                  <span>💰</span> Ventas ponderadas totales
                </span>
                <span className="text-sm font-bold text-rappi-orange">
                  ${decision_payload.total_revenue.toLocaleString("es-MX")} MXN/mes
                </span>
              </div>
            )}

            {/* Fuentes */}
            <p className="text-xs text-gray-400 pt-1">
              Fuentes conectadas:{" "}
              <span className="font-medium text-gray-500">
                {decision_payload.data_sources.length > 0
                  ? decision_payload.data_sources.join(" · ")
                  : "Sin fuentes externas"}
              </span>
            </p>
          </div>
        </details>
      )}

      <p className="text-xs text-gray-400 text-center">
        Ref: {application.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}
