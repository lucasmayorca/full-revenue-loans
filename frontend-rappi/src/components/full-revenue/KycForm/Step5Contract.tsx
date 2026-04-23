"use client";

import { useEffect, useRef, useState } from "react";
import type { Step1PersonalValues } from "./Step1Personal";

const CONTRACT_PARAGRAPHS = [
  {
    title: "1. Partes del contrato",
    body: "El presente Contrato de Crédito Simple se celebra entre Full Revenue Financial S.A.P.I. de C.V. SOFOM E.N.R. (\"el Acreedor\") y el solicitante identificado en el proceso de KYC (\"el Acreditado\").",
  },
  {
    title: "2. Monto y disposición",
    body: "El Acreedor otorga al Acreditado un crédito simple en MXN por el monto aprobado. La disposición se realiza mediante transferencia SPEI a la cuenta CLABE registrada, dentro de las 24 horas hábiles siguientes a la firma.",
  },
  {
    title: "3. Tasa de interés",
    body: "El crédito devengará intereses ordinarios a la tasa mensual de la oferta aceptada. La tasa anual equivalente (CAT) se detalla en el Estado de Cuenta. Las tasas son fijas durante la vigencia del contrato.",
  },
  {
    title: "4. Retención sobre ventas",
    body: "El Acreditado autoriza la retención automática del porcentaje acordado sobre cada liquidación de ventas en la plataforma Rappi, aplicada prioritariamente a intereses y luego a capital.",
  },
  {
    title: "5. Débito directo complementario",
    body: "Si las retenciones acumuladas en un mes no cubren la cuota mínima, el Acreditado autoriza el débito del remanente desde la cuenta bancaria registrada en la fecha de corte mensual.",
  },
  {
    title: "6. Plazo y prepago",
    body: "El plazo es el número de meses de la oferta, contado desde la disposición. El Acreditado puede liquidar anticipadamente sin penalización, conforme a la Ley para la Transparencia y Ordenamiento de los Servicios Financieros.",
  },
  {
    title: "7. Incumplimiento",
    body: "Mora superior a 30 días naturales genera intereses moratorios al doble de la tasa ordinaria sobre el saldo vencido. Full Revenue Financial puede reportar al Buró de Crédito conforme a la normativa vigente.",
  },
  {
    title: "8. Datos personales y jurisdicción",
    body: "Los datos se tratan conforme al Aviso de Privacidad en fullrevenue.mx/privacidad. Para cualquier controversia, las partes se someten a los tribunales competentes de la Ciudad de México.",
  },
];

interface Props {
  applicationId: string;
  personal: Step1PersonalValues | null;
  onSigned: () => void;
  onBack: () => void;
}

export function Step5Contract({ personal, onSigned, onBack }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const lastPoint   = useRef<{ x: number; y: number } | null>(null);

  const [isDrawing,    setIsDrawing]    = useState(false);
  const [hasSigned,    setHasSigned]    = useState(false);
  const [hasScrolled,  setHasScrolled]  = useState(false);
  const [agreed,       setAgreed]       = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const fullName = personal
    ? `${personal.first_name} ${personal.last_name}`.trim()
    : "";

  // Detect scroll to bottom
  useEffect(() => {
    const el = contractRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setHasScrolled(true);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Canvas helpers
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPos(e);
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPoint.current = pos;
    setHasSigned(true);
  }
  function endDraw() { setIsDrawing(false); lastPoint.current = null; }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function handleContinue() {
    if (!hasSigned || !agreed) return;
    setIsContinuing(true);
    sessionStorage.setItem("fr_signed_at", Date.now().toString());
    await new Promise((r) => setTimeout(r, 600));
    onSigned();
  }

  const canContinue = hasSigned && agreed;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-1">
        <h2 className="text-base font-bold text-gray-900">Firma tu contrato</h2>
        <p className="text-xs text-gray-400 mt-0.5">Leé el resumen y firmá para continuar</p>
      </div>

      {/* Contrato scrollable */}
      <div className="relative">
        <div
          ref={contractRef}
          className="h-52 overflow-y-auto bg-white border border-gray-200 rounded-2xl px-4 py-3 space-y-3 text-left shadow-inner"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Contrato de Crédito Simple — Full Revenue Financial
          </p>
          {fullName && (
            <p className="text-xs text-gray-700 font-medium">Acreditado: <span className="font-bold">{fullName}</span></p>
          )}
          {CONTRACT_PARAGRAPHS.map(({ title, body }) => (
            <div key={title} className="space-y-0.5">
              <p className="text-[11px] font-bold text-gray-800">{title}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Fecha: {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} · Versión 2025-001 · Válido conforme NOM-151-SCFI-2016
            </p>
          </div>
        </div>

        {/* Indicador scroll */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          {!hasScrolled ? (
            <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span className="text-[10px] text-gray-400">Desplazate para leer todo</span>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-full px-3 py-1 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-[10px] text-green-700 font-medium">Leído ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Checkbox aceptar */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-rappi-orange flex-shrink-0"
        />
        <span className="text-xs text-gray-600 leading-relaxed">
          Acepto los términos y condiciones del Contrato de Crédito Simple, incluyendo retención sobre ventas y débito directo.
        </span>
      </label>

      {/* Pad de firma */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Tu firma</p>
          {hasSigned && (
            <button type="button" onClick={clearSignature} className="text-xs text-gray-400 underline hover:text-gray-600">
              Limpiar
            </button>
          )}
        </div>

        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50 hover:border-gray-300 transition-colors">
          <canvas
            ref={canvasRef}
            width={600}
            height={140}
            className="w-full h-28 touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSigned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              <p className="text-xs text-gray-300">Dibujá tu firma aquí</p>
            </div>
          )}
          <div className="absolute bottom-5 left-5 right-5 border-b border-gray-200 pointer-events-none" />
          <p className="absolute bottom-1 left-5 text-[10px] text-gray-300 pointer-events-none">× Firma</p>
        </div>
        {fullName && (
          <p className="text-[10px] text-gray-400 text-center">{fullName}</p>
        )}
      </div>

      {/* Nota seguridad */}
      <div className="flex items-center justify-center gap-1.5 text-gray-400">
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        <p className="text-[10px]">Firma encriptada · TLS · NOM-151-SCFI-2016</p>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-1 pb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isContinuing}
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-all duration-150 hover:bg-gray-50 disabled:opacity-60 focus:outline-none"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isContinuing}
          className="flex-1 bg-rappi-orange text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-orange-200 active:scale-95 transition-all duration-150 hover:bg-rappi-orange-dark disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
        >
          {isContinuing ? "Procesando..." : "Continuar"}
        </button>
      </div>
    </div>
  );
}
