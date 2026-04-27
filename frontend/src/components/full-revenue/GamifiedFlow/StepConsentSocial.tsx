"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export interface ConsentSocialData {
  bureau_consent: true;
  twilio_consent: true;
  data_processing_consent: true;
  google_business_url: string;
}

const CONSENTS = [
  {
    id: "bureau",
    title: "Consulta al Buró de Crédito",
    description:
      "Autorizo la consulta de mi historial crediticio en el Buró de Crédito de México para evaluar mi solicitud de préstamo.",
  },
  {
    id: "twilio",
    title: "Verificación de identidad (Twilio)",
    description:
      "Autorizo la verificación de mi número de teléfono e identidad mediante Twilio Lookup para prevenir fraudes.",
  },
];

interface Props {
  onComplete: (data: ConsentSocialData) => void;
  isLoading?: boolean;
  facebookConnected: boolean;
  instagramConnected: boolean;
  onFacebookConnect: (currentGoogleUrl: string) => void;
  onInstagramConnect: (currentGoogleUrl: string) => void;
  defaultGoogleUrl?: string;
}

export function StepConsentSocial({
  onComplete,
  isLoading,
  facebookConnected,
  instagramConnected,
  onFacebookConnect,
  onInstagramConnect,
  defaultGoogleUrl = "",
}: Props) {
  const SS_CONSENT = "fr_consent_state";

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    const saved = sessionStorage.getItem(SS_CONSENT);
    if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    return {};
  });
  const [attempted, setAttempted] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(defaultGoogleUrl);

  useEffect(() => {
    if (defaultGoogleUrl && !googleUrl) {
      setGoogleUrl(defaultGoogleUrl);
    }
  }, [defaultGoogleUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = CONSENTS.every((c) => checked[c.id]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      sessionStorage.setItem(SS_CONSENT, JSON.stringify(next));
      return next;
    });
  }

  function handleSubmit() {
    setAttempted(true);
    if (!allChecked) return;
    sessionStorage.removeItem(SS_CONSENT);
    onComplete({
      bureau_consent: true,
      twilio_consent: true,
      data_processing_consent: true,
      google_business_url: googleUrl,
    });
  }

  const urlInputClass =
    "w-full h-10 px-3 border border-uber-gray-300 rounded-btn text-[14px] focus:outline-none focus:border-black transition-colors placeholder:text-uber-gray-500 bg-white";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-black mb-2">Autorizaciones y redes sociales</h2>
        <p className="text-[14px] text-uber-gray-700 leading-5">
          Autorizo a Uber Eats a compartir con{" "}
          <strong className="text-black">R2 Capital Technologies MX</strong> los
          datos necesarios para evaluar mi solicitud. Las consultas al buró no
          afectan tu score.
        </p>
      </div>

      {/* Banner */}
      <div className="bg-uber-gray-100 border border-uber-gray-200 rounded-card px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-card flex items-center justify-center flex-shrink-0 font-bold text-[18px]">
          →
        </div>
        <div>
          <p className="text-[14px] font-bold text-black">
            Desbloquea hasta 1.5x tu oferta actual
          </p>
          <p className="text-[12px] text-uber-gray-700 mt-0.5">
            Combinamos buró, identidad y presencia digital para ampliar tu crédito.
          </p>
        </div>
      </div>

      {/* Required: Checkboxes */}
      <div>
        <p className="text-[11px] font-bold text-uber-gray-500 uppercase tracking-wider mb-3">
          Autorizaciones requeridas
        </p>
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
                  <div
                    className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isChecked
                        ? "border-black bg-black"
                        : hasError
                        ? "border-uber-danger"
                        : "border-uber-gray-500"
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <path d="M10.28 2.28L4.5 8.06 2.22 5.78a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l6.5-6.5a1 1 0 00-1.44-1.44z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] font-bold text-black">
                        {consent.title}
                      </p>
                      <span className="text-[10px] font-bold text-uber-danger uppercase tracking-wider">
                        Requerido
                      </span>
                    </div>
                    <p className="text-[12px] text-uber-gray-700 leading-5">
                      {consent.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {attempted && !allChecked && (
          <p className="text-[12px] text-uber-danger font-medium text-center mt-2">
            Necesitas autorizar todas las consultas para continuar
          </p>
        )}
      </div>

      {/* Google Maps URL */}
      <div>
        <p className="text-[11px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1">
          Presencia digital{" "}
          <span className="normal-case font-normal">(opcional — amplía tu oferta)</span>
        </p>
        <p className="text-[12px] text-uber-gray-700 mb-3">
          Comparte los datos de tu negocio para que podamos evaluar tu presencia digital.
        </p>
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-medium text-black mb-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
            </svg>
            Google Maps
          </label>
          <input
            type="url"
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className={urlInputClass}
          />
        </div>
      </div>

      {/* Facebook + Instagram OAuth */}
      <div>
        <p className="text-[11px] font-bold text-uber-gray-500 uppercase tracking-wider mb-3">
          Redes sociales{" "}
          <span className="normal-case font-normal">(opcional — boost +8%)</span>
        </p>
        <div className="border border-uber-gray-200 rounded-card divide-y divide-uber-gray-100">
          {/* Facebook */}
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-black">Facebook</p>
                <p className="text-[12px] text-uber-gray-500">
                  Página del negocio — seguidores y reseñas
                </p>
              </div>
            </div>
            {facebookConnected ? (
              <div className="flex items-center gap-1.5 text-green-600 text-[12px] font-medium bg-green-50 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Conectado
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onFacebookConnect(googleUrl)}
                className="flex-shrink-0 text-[12px] font-medium text-uber-gray-700 border border-uber-gray-300 rounded-lg px-3 py-1.5 hover:bg-uber-gray-100 transition-colors"
              >
                Conectar
              </button>
            )}
          </div>

          {/* Instagram */}
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <defs>
                    <linearGradient id="ig-csc-uber" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F58529" />
                      <stop offset="50%" stopColor="#DD2A7B" />
                      <stop offset="100%" stopColor="#515BD4" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#ig-csc-uber)"
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-black">Instagram</p>
                <p className="text-[12px] text-uber-gray-500">
                  Perfil del negocio — seguidores y publicaciones
                </p>
              </div>
            </div>
            {instagramConnected ? (
              <div className="flex items-center gap-1.5 text-green-600 text-[12px] font-medium bg-green-50 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Conectado
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onInstagramConnect(googleUrl)}
                className="flex-shrink-0 text-[12px] font-medium text-uber-gray-700 border border-uber-gray-300 rounded-lg px-3 py-1.5 hover:bg-uber-gray-100 transition-colors"
              >
                Conectar
              </button>
            )}
          </div>
        </div>
        {(facebookConnected || instagramConnected) && (
          <div className="flex items-center gap-1.5 text-[12px] text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Tus redes sociales serán consideradas en la evaluación
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 bg-uber-gray-100 border border-uber-gray-200 rounded-card px-4 py-3">
        <svg
          className="w-5 h-5 text-black flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <div className="text-[12px] text-uber-gray-700 leading-5">
          <p className="font-bold text-black">Tus datos están protegidos</p>
          <p>
            Las consultas al buró son &ldquo;soft inquiries&rdquo; y no reducen tu score. R2
            Capital Technologies MX procesa todo de forma encriptada.
          </p>
        </div>
      </div>

      <Button onClick={handleSubmit} fullWidth size="lg" isLoading={isLoading}>
        Continuar y ver mi oferta
      </Button>
    </div>
  );
}
