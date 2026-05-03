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

      <p className="text-xs text-gray-400 text-center">
        Ref: {application.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}
