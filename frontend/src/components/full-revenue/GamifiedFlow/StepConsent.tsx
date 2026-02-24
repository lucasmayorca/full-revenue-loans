"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  onComplete: (data: { bureau_consent: true; twilio_consent: true; data_processing_consent: true }) => void;
  isLoading?: boolean;
}

interface ConsentItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  required: boolean;
}

const CONSENTS: ConsentItem[] = [
  {
    id: "bureau",
    icon: "📋",
    title: "Consulta al Buró de Crédito",
    description: "Autorizo la consulta de mi historial crediticio en el Buró de Crédito de México para evaluar mi solicitud de préstamo.",
    required: true,
  },
  {
    id: "twilio",
    icon: "🔐",
    title: "Verificación de identidad (Twilio)",
    description: "Autorizo la verificación de mi número de teléfono e identidad mediante Twilio Lookup para prevenir fraudes.",
    required: true,
  },
];

export function StepConsent({ onComplete, isLoading }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const allChecked = CONSENTS.every((c) => checked[c.id]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSubmit() {
    setAttempted(true);
    if (!allChecked) return;
    onComplete({ bureau_consent: true, twilio_consent: true, data_processing_consent: true });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Autorizaciones necesarias
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Para calcular tu primera oferta necesitamos tu autorización para consultar estas fuentes.
          Es seguro y no afecta tu crédito.
        </p>
      </div>

      {/* Banner: qué obtenés a cambio */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
          🎯
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800">Tu primera oferta se revela al autorizar</p>
          <p className="text-xs text-orange-600 mt-0.5">Verás tu crédito inicial de <strong>$50,000 MXN</strong> ampliado según tu historial</p>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        {CONSENTS.map((consent) => {
          const isChecked = !!checked[consent.id];
          const hasError = attempted && !isChecked;
          return (
            <button
              key={consent.id}
              type="button"
              onClick={() => toggle(consent.id)}
              className={`w-full text-left border-2 rounded-2xl p-4 transition-all focus:outline-none ${
                isChecked
                  ? "border-rappi-orange bg-orange-50"
                  : hasError
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Custom checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  isChecked
                    ? "border-rappi-orange bg-rappi-orange"
                    : hasError
                    ? "border-red-400"
                    : "border-gray-300"
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10.28 2.28L4.5 8.06 2.22 5.78a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l6.5-6.5a1 1 0 00-1.44-1.44z"/>
                    </svg>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{consent.icon}</span>
                    <p className="text-sm font-semibold text-gray-900">{consent.title}</p>
                    {consent.required && (
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Requerido</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{consent.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {attempted && !allChecked && (
        <p className="text-xs text-red-500 font-medium text-center">
          Necesitás autorizar todas las consultas para continuar
        </p>
      )}

      {/* Nota de seguridad */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <span className="text-base flex-shrink-0">🔒</span>
        <div className="text-xs text-blue-700 leading-relaxed space-y-0.5">
          <p className="font-semibold">Tus datos están protegidos</p>
          <p>Las consultas al buró son "soft inquiries" y no reducen tu score. Tus datos se procesan de forma encriptada y no los compartimos con terceros.</p>
        </div>
      </div>

      <Button onClick={handleSubmit} fullWidth size="lg" isLoading={isLoading}>
        Autorizar y ver mi oferta →
      </Button>
    </div>
  );
}
