"use client";

import { useEffect, useState } from "react";

interface Source {
  key: string;
  label: string;
  icon: string;
  delayMs: number;
}

const SOURCES: Source[] = [
  { key: "ubereats", label: "Ventas históricas en Uber Eats", icon: "🍔",  delayMs: 700  },
  { key: "sat",      label: "Historial fiscal SAT",           icon: "🏛️",  delayMs: 1600 },
  { key: "buro",     label: "Buró de Crédito",               icon: "📋",  delayMs: 2500 },
  { key: "google",   label: "Reputación en Google Maps",     icon: "📍",  delayMs: 3300 },
  { key: "facebook", label: "Presencia en Facebook",         icon: "💬",  delayMs: 4000 },
  { key: "instagram",label: "Presencia en Instagram",        icon: "📸",  delayMs: 4600 },
  { key: "twilio",   label: "Verificación de identidad",     icon: "🔐",  delayMs: 5300 },
  { key: "calc",     label: "Calculando tu oferta",          icon: "💰",  delayMs: 6200 },
];

export function UnderwritingLoader() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timers = SOURCES.map((source) =>
      setTimeout(() => {
        setCompleted((prev) => new Set(Array.from(prev).concat(source.key)));
      }, source.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const allDone = completed.size === SOURCES.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        {/* Título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-card bg-black flex items-center justify-center">
            {allDone ? (
              <svg className="w-8 h-8 text-uber-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <h2 className="text-h2 text-black mb-1">
            {allDone ? "Análisis completado" : "Analizando tu perfil"}
          </h2>
          <p className="text-[14px] text-uber-gray-700">
            {allDone
              ? "Preparando tu oferta personalizada..."
              : "Consultando todas tus fuentes de ingresos"}
          </p>
        </div>

        {/* Lista de fuentes */}
        <div className="space-y-2">
          {SOURCES.map((source) => {
            const isDone = completed.has(source.key);
            const isActive =
              !isDone &&
              SOURCES.findIndex((s) => !completed.has(s.key)) ===
                SOURCES.indexOf(source);

            return (
              <div
                key={source.key}
                className={`flex items-center gap-3 rounded-card px-4 py-3 transition-colors duration-500 ${
                  isDone
                    ? "bg-uber-success-bg border border-uber-success/30"
                    : isActive
                    ? "bg-uber-gray-100 border border-black"
                    : "bg-white border border-uber-gray-200 opacity-40"
                }`}
              >
                {/* Ícono fuente */}
                <span className="text-lg w-6 text-center flex-shrink-0">
                  {source.icon}
                </span>

                {/* Label */}
                <span
                  className={`text-[14px] flex-1 font-medium ${
                    isDone
                      ? "text-uber-success"
                      : isActive
                      ? "text-black"
                      : "text-uber-gray-500"
                  }`}
                >
                  {source.label}
                </span>

                {/* Estado */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <svg className="w-5 h-5 text-uber-success" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-uber-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-[12px] text-uber-gray-500 mb-1.5">
            <span>Progreso del análisis</span>
            <span>{Math.round((completed.size / SOURCES.length) * 100)}%</span>
          </div>
          <div className="w-full h-1 bg-uber-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(completed.size / SOURCES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
