"use client";

export type FlowStep =
  | "identity"     // 1. Datos del negocio
  | "consent"      // 2. Autorizaciones (buró + twilio)
  | "offer1"       // 3. Oferta inicial (1.5X)
  | "connections"  // 4. Google Maps + redes
  | "offer2"       // 5. Oferta ampliada (2X)
  | "fiscal"       // 6. Datos fiscales (RFC + CIEC)
  | "offer3";      // 7. Oferta máxima (4X)

const STEPS: { key: FlowStep; label: string; icon: string }[] = [
  { key: "identity",    label: "Negocio",   icon: "🏢" },
  { key: "consent",     label: "Autorizar", icon: "✅" },
  { key: "offer1",      label: "$75k",      icon: "🎯" },
  { key: "connections", label: "Digital",   icon: "📍" },
  { key: "offer2",      label: "$100k",     icon: "🚀" },
  { key: "fiscal",      label: "Fiscal",    icon: "🏛️" },
  { key: "offer3",      label: "$200k",     icon: "🏆" },
];

const STEP_ORDER = STEPS.map((s) => s.key);

interface Props {
  current: FlowStep;
  onBack?: () => void;
  offerAmounts?: { bureau: number; social: number; fiscal: number };
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function GamifiedProgressBar({ current, onBack, offerAmounts }: Props) {
  const currentIdx = STEP_ORDER.indexOf(current);

  // Build dynamic labels from real offer amounts when available
  const steps = STEPS.map((s) => {
    if (!offerAmounts) return s;
    if (s.key === "offer1") return { ...s, label: fmtK(offerAmounts.bureau) };
    if (s.key === "offer2") return { ...s, label: fmtK(offerAmounts.social) };
    if (s.key === "offer3") return { ...s, label: fmtK(offerAmounts.fiscal) };
    return s;
  });

  return (
    <div className="space-y-3">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium">
            Paso {currentIdx + 1} de {STEP_ORDER.length}
          </p>
        </div>
      </div>

      {/* Mini stepper visual */}
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const stepIdx = STEP_ORDER.indexOf(step.key);
          const isDone = stepIdx < currentIdx;
          const isActive = stepIdx === currentIdx;
          const isPending = stepIdx > currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-300 ${
                  isDone
                    ? "bg-green-100 text-green-700"
                    : isActive
                    ? "bg-rappi-orange text-white shadow-md shadow-orange-200 scale-110"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {isDone ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
                <p className={`text-[9px] mt-1 font-medium text-center ${
                  isDone ? "text-green-600" : isActive ? "text-rappi-orange font-bold" : "text-gray-400"
                }`}>
                  {step.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-shrink-0 w-4 mx-0.5 rounded-full transition-all duration-500 ${
                  stepIdx < currentIdx ? "bg-green-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progreso general */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rappi-orange to-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${((currentIdx) / (STEP_ORDER.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
