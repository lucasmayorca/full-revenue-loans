interface StepIndicatorProps {
  current: number;
  total: number;
}

const STEP_LABELS = ["Datos del negocio", "Ingresos", "Confirmar"];

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isCurrent = step === current;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    isCompleted
                      ? "bg-rappi-orange text-white"
                      : isCurrent
                      ? "bg-rappi-orange text-white ring-4 ring-orange-100"
                      : "bg-gray-200 text-gray-500",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={[
                    "text-xs mt-1 whitespace-nowrap",
                    isCurrent ? "text-rappi-orange font-medium" : "text-gray-400",
                  ].join(" ")}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>
              {step < total && (
                <div
                  className={[
                    "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                    isCompleted ? "bg-rappi-orange" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
