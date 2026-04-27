"use client";

import { useEffect, useState } from "react";

type Stage = "bureau" | "social" | "fiscal";

const CONFIG: Record<Stage, {
  title: string;
  subtitle: string;
  sources: string[];
}> = {
  bureau: {
    title: "Verificando tu historial crediticio",
    subtitle: "Consultamos buró e identidad para calcular tu oferta inicial.",
    sources: ["Buró de Crédito", "Twilio Identity", "Historial de plataforma"],
  },
  social: {
    title: "Evaluando tu historial y presencia digital",
    subtitle: "Verificamos buró, identidad y tus conexiones online para calcular tu primera oferta.",
    sources: ["Buró de Crédito + Twilio", "Google Maps / Places", "Facebook & Instagram"],
  },
  fiscal: {
    title: "Calculando tu capacidad real de pago",
    subtitle: "Procesamos tus datos del SAT para calcular la oferta máxima.",
    sources: ["SAT / CFDI", "Datos fiscales declarados", "Flujo de efectivo"],
  },
};

// Timing constants (ms)
const ITEM_APPEAR_INTERVAL = 500; // between each item appearing
const CHECK_DELAY          = 380; // after appearing, delay before checkmark
const DONE_AFTER           = 2800; // total duration before calling onDone

interface Props {
  stage: Stage;
  onDone: () => void;
}

export function OfferCalculatingLoader({ stage, onDone }: Props) {
  const config = CONFIG[stage];
  const [visibleCount, setVisibleCount] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const [showReady, setShowReady]       = useState(false);

  useEffect(() => {
    // Reset on stage change
    setVisibleCount(0);
    setCheckedCount(0);
    setShowReady(false);

    const timers: ReturnType<typeof setTimeout>[] = [];

    config.sources.forEach((_, i) => {
      // Item slides in
      timers.push(setTimeout(() => setVisibleCount(i + 1), ITEM_APPEAR_INTERVAL * (i + 1)));
      // Checkmark appears shortly after
      timers.push(setTimeout(() => setCheckedCount(i + 1), ITEM_APPEAR_INTERVAL * (i + 1) + CHECK_DELAY));
    });

    // "Oferta lista" flash
    timers.push(setTimeout(() => setShowReady(true), DONE_AFTER - 500));

    // Advance to offer reveal
    timers.push(setTimeout(onDone, DONE_AFTER));

    return () => timers.forEach(clearTimeout);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8 py-6">
      {/* Spinner + heading */}
      <div className="flex flex-col items-center text-center gap-5">
        {/* Arc spinner */}
        <div className="relative w-14 h-14 flex-shrink-0">
          {/* Track */}
          <svg className="w-14 h-14 text-uber-gray-200" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" />
          </svg>
          {/* Arc */}
          <svg
            className="w-14 h-14 absolute inset-0 animate-spin"
            style={{ animationDuration: "1s" }}
            viewBox="0 0 56 56"
            fill="none"
          >
            <path
              d="M28 6 A22 22 0 0 1 50 28"
              stroke="#FF441F"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <p className="text-[18px] font-bold text-black leading-snug">{config.title}</p>
          <p className="text-[13px] text-uber-gray-500 mt-1 leading-5 max-w-[260px]">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Staggered source checklist */}
      <div className="space-y-3">
        {config.sources.map((source, i) => {
          const visible = visibleCount > i;
          const checked = checkedCount > i;
          return (
            <div
              key={source}
              className={`flex items-center gap-3 transition-all duration-400 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
              style={{ transitionDuration: "350ms" }}
            >
              {/* Circle: loading ring → black check */}
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  checked
                    ? "bg-rappi-orange"
                    : visible
                    ? "border-2 border-uber-gray-300 animate-pulse"
                    : "border-2 border-uber-gray-200"
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              <span
                className={`text-[14px] transition-colors duration-300 ${
                  checked ? "text-rappi-dark font-medium" : "text-uber-gray-500"
                }`}
              >
                {source}
              </span>
            </div>
          );
        })}
      </div>

      {/* "Oferta lista" flash */}
      <div
        className={`text-center transition-all duration-500 ${
          showReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-uber-green">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Oferta lista
        </span>
      </div>
    </div>
  );
}
