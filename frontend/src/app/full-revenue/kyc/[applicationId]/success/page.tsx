"use client";

import { useEffect, useState } from "react";

interface Props {
  params: { applicationId: string };
}

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 60;
    const stepValue = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration]);
  return value;
}

export default function KycSuccessPage({ params }: Props) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    loanAmount: 0,
    applicationSeconds: 0,
    approvalSeconds: 0,
    accountLast4: "0000",
  });

  useEffect(() => {
    // Read loan amount from sessionStorage (set during offer acceptance)
    const offerAmounts = (() => {
      try {
        const raw = sessionStorage.getItem("fr_offer_amounts");
        if (raw) return JSON.parse(raw);
      } catch { /* ignore */ }
      return null;
    })();

    const signedAt = parseInt(sessionStorage.getItem("fr_signed_at") ?? "0", 10);
    const startedAt = parseInt(sessionStorage.getItem("fr_started_at") ?? "0", 10);
    const approvedAt = parseInt(sessionStorage.getItem("fr_approved_at") ?? "0", 10);

    const now = Date.now();
    const appSecs = startedAt ? Math.round((signedAt || now) - startedAt) / 1000 : 94;
    const approvalSecs = approvedAt ? Math.round((signedAt || now) - approvedAt) / 1000 : 12;

    setStats({
      loanAmount: offerAmounts?.fiscal ?? offerAmounts?.social ?? offerAmounts?.bureau ?? 75_000,
      applicationSeconds: Math.max(30, Math.round(appSecs)),
      approvalSeconds: Math.max(8, Math.round(approvalSecs)),
      accountLast4: "4821",
    });

    // Small delay to let the page mount before animating
    setTimeout(() => setMounted(true), 100);
  }, [params.applicationId]);

  const animatedAmount = useCountUp(mounted ? stats.loanAmount : 0, 1400);

  const STAT_ITEMS = [
    {
      icon: "⚡",
      label: "Tu solicitud tomó",
      value: `${stats.applicationSeconds} seg`,
      sub: "De inicio a firma",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
    },
    {
      icon: "🤖",
      label: "Aprobación en",
      value: `${stats.approvalSeconds} seg`,
      sub: "Decisión automática con IA",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-100",
    },
    {
      icon: "🏦",
      label: "Dinero enviado a",
      value: `••••${stats.accountLast4}`,
      sub: "Disponible en ~24 h",
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-100",
    },
  ];

  return (
    <div className="px-4 py-8 flex flex-col items-center space-y-6 max-w-sm mx-auto">
      {/* Confetti-style header */}
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rappi-orange to-rappi-orange-mid flex items-center justify-center shadow-lg shadow-orange-200 mb-1">
          <span className="text-3xl">🎉</span>
        </div>
        <div className="absolute -top-1 -right-4 text-2xl animate-bounce" style={{ animationDelay: "0.1s" }}>✨</div>
        <div className="absolute -top-2 -left-6 text-xl animate-bounce" style={{ animationDelay: "0.3s" }}>🌟</div>
      </div>

      {/* Main message */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">¡Tu préstamo está activo!</h1>
        <p className="text-sm text-gray-500">El dinero ya está en camino a tu cuenta</p>
      </div>

      {/* Loan amount hero */}
      <div className="w-full bg-gradient-to-br from-rappi-orange to-rappi-orange-mid rounded-3xl p-6 text-white text-center shadow-xl shadow-orange-200 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white opacity-5 rounded-full" />
        <div className="absolute -left-4 -bottom-6 w-28 h-28 bg-white opacity-5 rounded-full" />
        <p className="text-sm opacity-75 mb-1">Tu préstamo de</p>
        <p className="text-5xl font-black leading-none tracking-tight mb-1">
          ${fmt(animatedAmount)}
        </p>
        <p className="text-lg opacity-80">MXN</p>
        <p className="text-xs opacity-60 mt-2">fue aprobado y enviado exitosamente ✓</p>
      </div>

      {/* Stats — compactas en grid 3 columnas */}
      <div className="w-full">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Estadísticas</p>
        <div className="grid grid-cols-3 gap-2">
          {STAT_ITEMS.map(({ icon, label, value, sub, bg, text, border }) => (
            <div
              key={label}
              className={`flex flex-col items-center text-center ${bg} border ${border} rounded-2xl px-2 py-3 gap-1`}
            >
              <span className="text-lg">{icon}</span>
              <p className={`text-sm font-bold leading-tight ${text}`}>{value}</p>
              <p className="text-[9px] text-gray-500 leading-tight">{label}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 text-left">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">¿Qué sigue?</p>
        {[
          { icon: "📧", title: "Confirmación por email y WhatsApp", desc: "Recibirás el comprobante de tu contrato firmado." },
          { icon: "📅", title: "Primera cuota en 30 días", desc: "La retención sobre ventas Rappi arranca de forma automática." },
          { icon: "📊", title: "Seguí tu saldo en tiempo real", desc: "Consultá tu estado de cuenta desde la app de Rappi." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        ¿Dudas? Escribinos a{" "}
        <a href="mailto:prestamos@rappi.com" className="text-rappi-orange font-medium">
          prestamos@rappi.com
        </a>
      </p>
    </div>
  );
}
