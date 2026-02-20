import type { Application, DecisionStatus } from "@/types/application";
import { StatusBadge } from "./StatusBadge";

const STATUS_COPY: Record<
  DecisionStatus,
  { title: string; description: string; icon: string }
> = {
  UNDERWRITING_PENDING: {
    title: "Analizando tu solicitud",
    description:
      "Estamos evaluando tus ingresos y datos. El proceso suele tomar menos de 2 minutos.",
    icon: "⏳",
  },
  APPROVED: {
    title: "Solicitud aceptada",
    description:
      "Recibimos tu solicitud de Préstamo MÁS. Vamos a revisar tu información y te enviaremos un email con el nuevo monto preaprobado en las próximas 24–48 horas hábiles.",
    icon: "✅",
  },
  REJECTED: {
    title: "Solicitud no aprobada",
    description:
      "Por el momento no podemos aprobar tu solicitud. Podés volver a intentarlo en 90 días o contactar a soporte para más información.",
    icon: "❌",
  },
  MANUAL_REVIEW: {
    title: "Solicitud en revisión",
    description:
      "¡Recibimos tu solicitud de Préstamo MÁS! Nuestro equipo está analizando tus datos fiscales y digitales para determinar tu nuevo monto preaprobado. Te enviaremos un email con el resultado en las próximas 24–48 horas hábiles.",
    icon: "🔍",
  },
};

interface Props {
  application: Application;
}

export function StatusCard({ application }: Props) {
  const copy = STATUS_COPY[application.decision_status];
  const isPending = application.decision_status === "UNDERWRITING_PENDING";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">{copy.icon}</div>
        <StatusBadge status={application.decision_status} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{copy.title}</h2>
        <p className="text-gray-600 leading-relaxed">{copy.description}</p>

        {isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Actualizando automáticamente cada 5 segundos...
          </div>
        )}

        {application.decision_payload && !isPending && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Datos recopilados para la evaluación
            </p>
            <div className="space-y-2">
              {/* Ventas SAT */}
              {application.decision_payload.syntage_monthly_revenue > 0 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>🏛️</span> Ventas SAT (Syntage)
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    ${application.decision_payload.syntage_monthly_revenue.toLocaleString("es-MX")} MXN/mes
                  </span>
                </div>
              )}
              {/* Score Google */}
              {application.decision_payload.google_signals_score > 0 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>📊</span> Score digital Google
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {application.decision_payload.google_signals_score}/100
                  </span>
                </div>
              )}
              {/* Ventas totales ponderadas */}
              {application.decision_payload.total_revenue > 0 && (
                <div className="flex items-center justify-between bg-rappi-orange-light rounded-lg px-3 py-2 border border-orange-100">
                  <span className="text-xs text-rappi-orange font-medium flex items-center gap-1.5">
                    <span>💰</span> Ventas estimadas totales
                  </span>
                  <span className="text-sm font-bold text-rappi-orange">
                    ${application.decision_payload.total_revenue.toLocaleString("es-MX")} MXN/mes
                  </span>
                </div>
              )}
              {/* Fuentes */}
              <p className="text-xs text-gray-400 pt-1">
                Fuentes conectadas:{" "}
                <span className="font-medium text-gray-500">
                  {application.decision_payload.data_sources.length > 0
                    ? application.decision_payload.data_sources.join(" · ")
                    : "Sin fuentes externas"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Ref: {application.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}
