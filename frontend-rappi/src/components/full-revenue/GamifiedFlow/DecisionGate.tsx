"use client";

interface Props {
  currentAmount: number;
  potentialAmount: number;
  stage: "after_bureau" | "after_social";
  onApplyNow: () => void;
  onContinue: () => void;
  nextStepLabel: string;
  isSubmitting?: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const STAGE_CONFIG = {
  after_bureau: {
    continueTitle: "Conectá tu presencia digital",
    continueSubtitle: "Agregá Google Maps y redes sociales para ampliar tu oferta",
    continueIcon: "📍",
    continueHighlight: "text-green-700",
    continueHighlightBg: "bg-green-50 border-green-200",
    applyNote: "También podés aplicar con la oferta actual",
  },
  after_social: {
    continueTitle: "Esta es tu oferta máxima",
    continueSubtitle: "Ya aprovechaste todas las fuentes de datos disponibles",
    continueIcon: "🏆",
    continueHighlight: "text-orange-700",
    continueHighlightBg: "bg-orange-50 border-orange-200",
    applyNote: "Podés aplicar al préstamo ahora",
  },
};

export function DecisionGate({
  currentAmount,
  potentialAmount,
  stage,
  onApplyNow,
  onContinue,
  nextStepLabel,
  isSubmitting,
}: Props) {
  const config = STAGE_CONFIG[stage];
  const gain = potentialAmount - currentAmount;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué querés hacer?</h2>
        <p className="text-sm text-gray-500">Elegí cómo continuar</p>
      </div>

      {/* Opción 1: Continuar (si hay más para desbloquear) */}
      {stage === "after_bureau" && (
        <button
          type="button"
          onClick={onContinue}
          className={`w-full text-left border-2 rounded-2xl p-4 ${config.continueHighlightBg} transition-all hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1`}
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
              {config.continueIcon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className={`text-sm font-bold ${config.continueHighlight}`}>{config.continueTitle}</p>
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                  +${fmt(gain)} MXN
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{config.continueSubtitle}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="flex-1 text-center bg-white border border-green-200 rounded-xl py-2 px-3">
                  <p className="text-xs text-gray-500">Oferta actual</p>
                  <p className="text-sm font-bold text-gray-900">${fmt(currentAmount)}</p>
                </div>
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                <div className="flex-1 text-center bg-green-50 border border-green-300 rounded-xl py-2 px-3">
                  <p className="text-xs text-green-600 font-medium">Potencial</p>
                  <p className="text-sm font-bold text-green-800">${fmt(potentialAmount)}</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-green-700 mt-2.5 text-center">
                {nextStepLabel} →
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Opción 2: Aplicar ya */}
      <button
        type="button"
        onClick={onApplyNow}
        disabled={isSubmitting}
        className={`w-full rounded-2xl p-4 transition-all focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:ring-offset-1 ${
          stage === "after_social"
            ? "bg-gradient-to-br from-rappi-orange to-rappi-orange-mid text-white shadow-lg shadow-orange-200 hover:shadow-xl active:scale-[0.99]"
            : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 active:scale-[0.99] hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
            stage === "after_social" ? "bg-white bg-opacity-20" : "bg-orange-50"
          }`}>
            🚀
          </div>
          <div className="text-left flex-1">
            <p className={`text-sm font-bold ${stage === "after_social" ? "text-white" : "text-gray-900"}`}>
              Aplicar al préstamo ahora
            </p>
            <p className={`text-xs mt-0.5 ${stage === "after_social" ? "text-white opacity-80" : "text-gray-500"}`}>
              Con ${fmt(currentAmount)} MXN · {config.applyNote}
            </p>
          </div>
          {isSubmitting ? (
            <svg className={`w-5 h-5 animate-spin flex-shrink-0 ${stage === "after_social" ? "text-white" : "text-rappi-orange"}`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className={`w-5 h-5 flex-shrink-0 ${stage === "after_social" ? "text-white" : "text-rappi-orange"}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          )}
        </div>
      </button>

      {/* Nota de seguridad */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        🔒 Sin compromiso hasta que confirmés en el paso de KYC.
        Tu oferta queda reservada por 72 hs.
      </p>
    </div>
  );
}
