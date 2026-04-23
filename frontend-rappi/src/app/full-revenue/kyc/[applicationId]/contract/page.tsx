"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  params: { applicationId: string };
}

const CONTRACT_PARAGRAPHS = [
  {
    title: "1. Partes del contrato",
    body: "El presente Contrato de Crédito Simple (en adelante, el \"Contrato\") se celebra entre Full Revenue Financial S.A.P.I. de C.V. SOFOM E.N.R. (en adelante, \"el Acreedor\") y el solicitante identificado en el proceso de KYC (en adelante, \"el Acreditado\").",
  },
  {
    title: "2. Monto y disposición",
    body: "El Acreedor otorga al Acreditado un crédito simple en moneda nacional (MXN) por el monto aprobado en la oferta de crédito. La disposición se realiza mediante transferencia electrónica (SPEI) a la cuenta CLABE registrada en la solicitud dentro de las 24 horas hábiles siguientes a la firma del presente contrato.",
  },
  {
    title: "3. Tasa de interés",
    body: "El crédito devengará intereses ordinarios a la tasa mensual indicada en la oferta de crédito aceptada. La tasa anual equivalente (CAT) se detalla en el Estado de Cuenta que se pondrá a disposición del Acreditado. Las tasas no son variables durante la vigencia del contrato.",
  },
  {
    title: "4. Forma de pago — retención sobre ventas",
    body: "El Acreditado autoriza expresamente a Full Revenue Financial a realizar una retención automática del porcentaje acordado sobre cada liquidación de ventas procesadas en la plataforma Rappi. Dicha retención se aplicará de forma prioritaria al pago de intereses y posteriormente al capital del crédito.",
  },
  {
    title: "5. Débito directo complementario",
    body: "En caso de que las retenciones acumuladas en un mes calendario no alcancen a cubrir la cuota mensual mínima pactada, el Acreditado autoriza al Acreedor a realizar un cargo por débito directo al monto faltante desde la cuenta bancaria registrada en el proceso de KYC, en la fecha de corte mensual.",
  },
  {
    title: "6. Plazo",
    body: "El plazo del crédito es el número de meses indicado en la oferta de crédito aceptada, contado a partir de la fecha de disposición. El Acreditado podrá liquidar anticipadamente el saldo total sin penalización, de conformidad con lo dispuesto por la Ley para la Transparencia y Ordenamiento de los Servicios Financieros.",
  },
  {
    title: "7. Incumplimiento",
    body: "En caso de incumplimiento de pago por más de 30 días naturales, el crédito será considerado en mora y se aplicarán intereses moratorios equivalentes al doble de la tasa ordinaria sobre el saldo vencido. Full Revenue Financial se reserva el derecho de reportar al Acreditado ante las sociedades de información crediticia conforme a la normativa vigente.",
  },
  {
    title: "8. Datos personales",
    body: "El Acreditado consiente el tratamiento de sus datos personales conforme al Aviso de Privacidad publicado en fullrevenue.mx/privacidad. Los datos serán utilizados exclusivamente para la administración del crédito, prevención de fraude y cumplimiento de obligaciones regulatorias.",
  },
  {
    title: "9. Jurisdicción",
    body: "Para todo lo relativo a la interpretación y cumplimiento del presente Contrato, las partes se someten expresamente a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando al fuero que pudiera corresponderles por razón de su domicilio presente o futuro.",
  },
];

export default function ContractPage({ params }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Track if user scrolled to bottom of contract
  useEffect(() => {
    const el = contractRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      if (atBottom) setHasScrolled(true);
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Canvas drawing helpers
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = pos;
    setHasSigned(true);
  }

  function endDraw() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function handleSign() {
    if (!hasSigned || !agreed) return;
    setIsSigning(true);
    // Simulate signing delay
    await new Promise((r) => setTimeout(r, 1800));
    // Record signed timestamp in sessionStorage for the success page
    sessionStorage.setItem("fr_signed_at", Date.now().toString());
    router.push(`/full-revenue/kyc/${params.applicationId}/success`);
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          Contrato seguro · Firma digital
        </div>
        <h1 className="text-xl font-bold text-gray-900">Firma tu contrato</h1>
        <p className="text-sm text-gray-500">Leé el contrato y firmá para activar tu crédito</p>
      </div>

      {/* Contract scroll area */}
      <div className="relative">
        <div
          ref={contractRef}
          className="h-64 overflow-y-auto bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-4 text-left shadow-inner"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            Contrato de Crédito Simple
          </p>
          {CONTRACT_PARAGRAPHS.map(({ title, body }) => (
            <div key={title} className="space-y-1">
              <p className="text-xs font-bold text-gray-800">{title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Fecha de celebración: {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.
              Versión del contrato: 2025-001. Este contrato tiene plena validez legal conforme a la NOM-151-SCFI-2016 sobre conservación de mensajes de datos.
            </p>
          </div>
        </div>

        {/* Scroll to bottom hint */}
        {!hasScrolled && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-white border border-gray-200 shadow-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <span className="text-[10px] text-gray-400">Desplazate para leer todo el contrato</span>
            </div>
          </div>
        )}

        {hasScrolled && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-green-50 border border-green-200 rounded-full px-3 py-1 flex items-center gap-1.5">
              <svg className="w-3 h-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-[10px] text-green-700 font-medium">Contrato leído ✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange accent-rappi-orange"
        />
        <span className="text-xs text-gray-600 leading-relaxed">
          He leído, entiendo y acepto los términos y condiciones del Contrato de Crédito Simple, incluyendo la autorización de retención sobre ventas y débito directo.
        </span>
      </label>

      {/* Signature pad */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Tu firma</p>
          {hasSigned && (
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50 hover:border-gray-300 transition-colors">
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="w-full h-36 touch-none cursor-crosshair"
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
              <svg className="w-6 h-6 text-gray-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              <p className="text-xs text-gray-300">Dibujá tu firma aquí</p>
            </div>
          )}

          {/* Signature baseline */}
          <div className="absolute bottom-6 left-6 right-6 border-b border-gray-200 pointer-events-none" />
          <p className="absolute bottom-1.5 left-6 text-[10px] text-gray-300 pointer-events-none">× Firma</p>
        </div>
      </div>

      {/* Sign button */}
      <button
        type="button"
        onClick={handleSign}
        disabled={!hasSigned || !agreed || isSigning}
        className="w-full bg-rappi-orange text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-orange-200 active:scale-95 transition-all duration-150 hover:bg-rappi-orange-dark focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isSigning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Procesando firma...
          </span>
        ) : (
          "Firmar y activar crédito"
        )}
      </button>

      {(!hasSigned || !agreed) && (
        <p className="text-xs text-gray-400 text-center">
          {!agreed && !hasSigned
            ? "Aceptá los términos y firmá para continuar"
            : !agreed
            ? "Aceptá los términos para continuar"
            : "Dibujá tu firma para continuar"}
        </p>
      )}

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-gray-400">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        <p className="text-[10px]">Firma encriptada con TLS · Válida según NOM-151-SCFI-2016</p>
      </div>
    </div>
  );
}
