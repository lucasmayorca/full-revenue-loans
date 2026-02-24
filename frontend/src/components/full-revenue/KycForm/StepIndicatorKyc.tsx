"use client";

const STEPS = [
  "Datos personales",
  "Domicilio",
  "Cuenta bancaria",
  "Documentos",
  "Confirmación",
];

interface Props {
  current: number; // 1-based
  total: number;
}

export function StepIndicatorKyc({ current, total }: Props) {
  return (
    <div className="mb-6">
      {/* Barra de progreso */}
      <div className="h-1 bg-gray-200 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-rappi-orange rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      {/* Label del paso actual */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">{STEPS[current - 1]}</p>
        <p className="text-xs text-gray-400">
          Paso {current} de {total}
        </p>
      </div>
    </div>
  );
}
