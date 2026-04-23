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
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-black mb-2">Autorizaciones necesarias</h2>
        <p className="text-[14px] text-uber-gray-700 leading-5">
          Autorizo a Rappi a compartir con <strong className="text-black">R2 Capital Technologies MX</strong> los datos necesarios para consultar mi historial crediticio y verificar mi identidad. Ninguna de estas consultas afecta tu score.
        </p>
      </div>

      {/* Banner: qué obtenés a cambio */}
      <div className="bg-uber-gray-100 border border-uber-gray-200 rounded-card px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-card flex items-center justify-center flex-shrink-0 font-bold text-[18px]">
          →
        </div>
        <div>
          <p className="text-[14px] font-bold text-black">Tu primera oferta se revela al autorizar</p>
          <p className="text-[12px] text-uber-gray-700 mt-0.5">Arrancamos con un crédito base y lo ampliamos según tu historial.</p>
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
              className={`w-full text-left border rounded-card p-4 transition-colors focus:outline-none ${
                isChecked
                  ? "border-black bg-uber-gray-100"
                  : hasError
                  ? "border-uber-danger bg-uber-danger-bg"
                  : "border-uber-gray-300 bg-white hover:border-black"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Custom checkbox */}
                <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isChecked
                    ? "border-black bg-black"
                    : hasError
                    ? "border-uber-danger"
                    : "border-uber-gray-500"
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10.28 2.28L4.5 8.06 2.22 5.78a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l6.5-6.5a1 1 0 00-1.44-1.44z"/>
                    </svg>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[14px] font-bold text-black">{consent.title}</p>
                    {consent.required && (
                      <span className="text-[10px] font-bold text-uber-danger uppercase tracking-wider">Requerido</span>
                    )}
                  </div>
                  <p className="text-[12px] text-uber-gray-700 leading-5">{consent.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {attempted && !allChecked && (
        <p className="text-[12px] text-uber-danger font-medium text-center">
          Necesitas autorizar todas las consultas para continuar
        </p>
      )}

      {/* Nota de seguridad */}
      <div className="flex items-start gap-3 bg-uber-gray-100 border border-uber-gray-200 rounded-card px-4 py-3">
        <svg className="w-5 h-5 text-black flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <div className="text-[12px] text-uber-gray-700 leading-5">
          <p className="font-bold text-black">Tus datos están protegidos</p>
          <p>Las consultas al buró son "soft inquiries" y no reducen tu score. R2 Capital Technologies MX procesa todo de forma encriptada y no comparte datos con terceros.</p>
        </div>
      </div>

      <Button onClick={handleSubmit} fullWidth size="lg" isLoading={isLoading}>
        Autorizar y ver mi oferta
      </Button>
    </div>
  );
}
