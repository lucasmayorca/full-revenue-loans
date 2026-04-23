interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepSummaryProps {
  steps: Step[];
}

export function StepSummary({ steps }: StepSummaryProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Cómo funciona
      </p>
      {steps.map((step, index) => (
        <div key={step.number} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-rappi-orange text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div className="w-0.5 h-full mt-1 bg-gray-200 min-h-[2rem]" />
            )}
          </div>
          <div className="pb-4">
            <p className="font-semibold text-gray-900">{step.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
