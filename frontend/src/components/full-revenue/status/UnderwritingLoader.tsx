"use client";

import { useEffect, useState } from "react";
import { Store, Landmark, FileText, MapPin, MessageCircle, Camera, ShieldCheck, TrendingUp } from "lucide-react";

function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <defs>
        <linearGradient id="ig-ul-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80"/>
          <stop offset="25%" stopColor="#F77737"/>
          <stop offset="50%" stopColor="#E1306C"/>
          <stop offset="75%" stopColor="#833AB4"/>
          <stop offset="100%" stopColor="#405DE6"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-ul-grad)"/>
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
    </svg>
  );
}

interface Source {
  key: string;
  label: string;
  icon: React.ReactNode;
  delayMs: number;
}

const SOURCES: Source[] = [
  { key: "ubereats",  label: "Ventas históricas en Uber Eats", icon: <Store className="w-4 h-4" />,        delayMs: 700  },
  { key: "sat",       label: "Historial fiscal SAT",           icon: <Landmark className="w-4 h-4" />,     delayMs: 1600 },
  { key: "buro",      label: "Buró de Crédito",               icon: <FileText className="w-4 h-4" />,     delayMs: 2500 },
  { key: "google",    label: "Reputación en Google Maps",     icon: <MapPin className="w-4 h-4" />,        delayMs: 3300 },
  { key: "facebook",  label: "Presencia en Facebook",         icon: <FbIcon />,                            delayMs: 4000 },
  { key: "instagram", label: "Presencia en Instagram",        icon: <IgIcon />,                            delayMs: 4600 },
  { key: "twilio",    label: "Verificación de identidad",     icon: <ShieldCheck className="w-4 h-4" />,  delayMs: 5300 },
  { key: "calc",      label: "Calculando tu oferta",          icon: <TrendingUp className="w-4 h-4" />,   delayMs: 6200 },
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
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-500">
                  {source.icon}
                </span>

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
