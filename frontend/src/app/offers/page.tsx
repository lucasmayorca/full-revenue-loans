"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

type OfferId = string;

interface RbfOffer {
  id: OfferId;
  receive: number;
  retention: number; // %
  totalToPay: number;
  fixedFee: number;
  monthlyMin: number;
  maxTerm: string;
}

const DEFAULT_OFFERS: RbfOffer[] = [
  {
    id: "oferta1",
    receive: 50000,
    retention: 32.92,
    totalToPay: 65100,
    fixedFee: 15100,
    monthlyMin: 10300,
    maxTerm: "6.3 meses",
  },
  {
    id: "oferta2",
    receive: 35000,
    retention: 24.9,
    totalToPay: 44550,
    fixedFee: 9550,
    monthlyMin: 7100,
    maxTerm: "6.3 meses",
  },
];

const SS_BASE_AMOUNT = "fr_base_amount";
const SS_PREFILL     = "fr_prefill";
const SS_PREFILL_TOKEN = "fr_prefill_token";

function formatMxn(value: number) {
  return "$" + value.toLocaleString("en-US");
}

type TabId = "ofertas" | "beneficios" | "como" | "faq";

function FinanciamientoInner() {
  const { trackEvent } = useTracking();
  const searchParams = useSearchParams();
  const hasToken = searchParams.get("t") !== null;

  const [activeTab, setActiveTab] = useState<TabId>("ofertas");
  const [offers, setOffers] = useState<RbfOffer[]>(DEFAULT_OFFERS);
  const [fullRevenueMax, setFullRevenueMax] = useState<number>(DEFAULT_OFFERS[0].receive * 2);
  const [personaType, setPersonaType] = useState<"fisica" | "moral">("fisica");
  const [consentChecked, setConsentChecked] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  // prefillResolved: true cuando el fetch terminó (éxito o error). Si NO hay
  // token, arranca true. Si hay token, arranca false para evitar el flash de
  // las ofertas default antes de que llegue la data del backend.
  const [prefillResolved, setPrefillResolved] = useState(!hasToken);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);

  // Hidratar ofertas + prefill desde ?t=token
  useEffect(() => {
    const token = searchParams.get("t");
    if (!token) return;

    api
      .getPrefillLink(token)
      .then((data) => {
        // Ofertas RBF custom (si vienen en el link)
        if (data.offers && data.offers.length > 0) {
          const mapped: RbfOffer[] = data.offers.map((o, idx) => ({
            id: o.id ?? `oferta${idx + 1}`,
            receive: o.receive,
            retention: o.retention ?? 0,
            totalToPay: o.totalToPay ?? o.receive,
            fixedFee: o.fixedFee ?? 0,
            monthlyMin: o.monthlyMin ?? 0,
            maxTerm: o.maxTerm ?? "",
          }));
          setOffers(mapped);
        }

        // Base amount para Financiamiento MÁS
        const baseAmount =
          data.base_amount ??
          (data.offers && data.offers[0] ? data.offers[0].receive : null);
        if (baseAmount) {
          setFullRevenueMax(baseAmount * 2);
          sessionStorage.setItem(SS_BASE_AMOUNT, String(baseAmount));
        }

        // Guardar prefill + token para que los siguientes pasos lo lean
        if (data.prefill) {
          sessionStorage.setItem(SS_PREFILL, JSON.stringify(data.prefill));
          if (data.prefill.first_name) setMerchantName(data.prefill.first_name);
        }
        sessionStorage.setItem(SS_PREFILL_TOKEN, token);

        trackEvent(EVENTS.PREFILL_LINK_OPENED, {
          token,
          merchant_id: data.merchant_id ?? undefined,
        });
      })
      .catch((err) => {
        const status = err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
        if (status === 404) setPrefillError("Link inválido.");
        else if (status === 410) setPrefillError("Link expirado.");
        else setPrefillError("No se pudo cargar la oferta personalizada.");
      })
      .finally(() => setPrefillResolved(true));
  }, [searchParams, trackEvent]);

  useEffect(() => {
    trackEvent(EVENTS.OFFERS_PAGE_VIEWED);
    offers.forEach((offer, idx) => {
      trackEvent(EVENTS.OFFER_CARD_VIEWED, {
        offer_id: offer.id,
        position: idx,
        receive_amount: offer.receive,
      });
    });
  }, [trackEvent, offers]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    trackEvent(EVENTS.OFFERS_TAB_CHANGED, { tab });
  }

  function handleOfferSelect(offer: RbfOffer) {
    trackEvent(EVENTS.OFFER_CARD_SELECT_CLICKED, {
      offer_id: offer.id,
      receive_amount: offer.receive,
      retention: offer.retention,
    });
    alert("Esta oferta base no está disponible en el prototipo. Prueba Préstamo MÁS.");
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      {/* Title */}
      <h1 className="text-[40px] font-bold text-black leading-[1.1] tracking-tight mb-8">
        {merchantName ? `Hola ${merchantName}` : "Financiamiento MÁS"}
      </h1>

      {prefillError && (
        <div className="mb-4 p-3 bg-uber-danger-bg border border-uber-danger/30 rounded-card text-[13px] text-uber-danger">
          {prefillError} Te mostramos las ofertas base.
        </div>
      )}

      {/* Tabs row */}
      <div className="border-b border-uber-gray-300 flex items-center justify-between pt-[5px] mb-8">
        <nav className="flex items-center gap-2">
          <TabButton
            active={activeTab === "ofertas"}
            onClick={() => handleTabChange("ofertas")}
          >
            Ofertas
          </TabButton>
          <TabButton
            active={activeTab === "beneficios"}
            onClick={() => handleTabChange("beneficios")}
          >
            Beneficios
          </TabButton>
          <TabButton
            active={activeTab === "como"}
            onClick={() => handleTabChange("como")}
          >
            Cómo funciona
          </TabButton>
          <TabButton
            active={activeTab === "faq"}
            onClick={() => handleTabChange("faq")}
          >
            Preguntas frecuentes
          </TabButton>
        </nav>
        <button
          type="button"
          className="border-2 border-black rounded-pill px-4 py-2 text-[14px] font-bold text-black hover:bg-uber-gray-100 transition-colors"
        >
          Dar Sugerencias
        </button>
      </div>

      {activeTab === "ofertas" && (
        <div className="flex flex-col gap-10">
          {/* ── Productos disponibles (Full Revenue + 2 RBF) ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[11px] font-semibold text-uber-gray-500 uppercase tracking-widest">
                Productos disponibles
              </p>
              <div className="flex-1 h-px bg-uber-gray-200" />
            </div>

            {!prefillResolved ? (
              /* Skeleton mientras hidratamos el prefill — evita flash de defaults */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-uber-gray-200 rounded-card animate-pulse h-[360px]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ── Financiamiento MÁS — Full Revenue Loans ── */}
                <FullRevenueCard maxAmount={fullRevenueMax} baseAmount={offers[0]?.receive ?? 0} />

                {/* ── Ofertas RBF — una por columna ── */}
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onSelect={() => handleOfferSelect(offer)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* CAT disclosure */}
          <p className="text-[12px] leading-[18px] text-black">
            El promedio del Costo Anual Total (CAT) de las ofertas es [105%]
            sin IVA. Este porcentaje es una referencia informativa y su cálculo
            se basa en el valor de tus pagos mínimos mensuales.
          </p>

          {/* Persona física / moral */}
          <div className="flex flex-col gap-4">
            <p className="text-[16px] font-bold text-black">
              Confirma el tipo de persona de tu negocio:
            </p>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="persona"
                  checked={personaType === "fisica"}
                  onChange={() => setPersonaType("fisica")}
                  className="w-5 h-5 accent-black"
                />
                <span className="text-[16px] text-uber-gray-700">
                  Persona física
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="persona"
                  checked={personaType === "moral"}
                  onChange={() => setPersonaType("moral")}
                  className="w-5 h-5 accent-black"
                />
                <span className="text-[16px] text-uber-gray-700">
                  Persona moral
                </span>
              </label>
            </div>
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-[18px] h-[18px] accent-black flex-shrink-0"
            />
            <span className="text-[12px] leading-5 text-uber-gray-700">
              Autorizo a Uber Eats a compartir con{" "}
              <strong className="text-black">
                R2 CAPITAL TECHNOLOGIES MX S.A. DE C.V.
              </strong>{" "}
              la información de mi negocio (incluyendo datos financieros, de
              contacto y personales) con fines de elegibilidad para el
              otorgamiento de un crédito. Lo anterior, de acuerdo con la{" "}
              <a className="underline font-bold text-black" href="#">
                Autorización para compartir datos personales
              </a>{" "}
              y los{" "}
              <a className="underline font-bold text-black" href="#">
                Términos y Condiciones
              </a>
              .
            </span>
          </label>

          {/* Survey accordion */}
          <div className="border border-black rounded-card overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 hover:bg-uber-gray-100 transition-colors"
              onClick={() => setSurveyOpen(!surveyOpen)}
              aria-expanded={surveyOpen}
            >
              <span className="flex items-center gap-2 text-[16px] font-bold text-uber-gray-700">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Queremos saber tu opinión
              </span>
              <svg
                className={[
                  "w-5 h-5 transition-transform",
                  surveyOpen ? "rotate-180" : "",
                ].join(" ")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {surveyOpen && (
              <div className="px-4 pb-5 pt-0 text-[14px] text-uber-gray-700 leading-5">
                <p className="mb-3">
                  ¿Las ofertas se ajustan a lo que tu negocio necesita?
                  Cuéntanos qué te gustaría ver distinto.
                </p>
                <textarea
                  placeholder="Tu opinión nos ayuda a mejorar"
                  className="w-full h-24 p-3 border border-uber-gray-300 rounded-btn text-[14px] resize-none focus:outline-none focus:border-black"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab !== "ofertas" && (
        <div className="py-20 text-center">
          <p className="text-[16px] text-uber-gray-500">
            Esta pestaña es parte de la experiencia completa de Uber Eats
            Manager y no está disponible en este prototipo.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Material Symbols filled — same style as sidebar icons ── */
const IconBarChart = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M3 3v18h18v-2H5V3H3zm16 4h-4v10h4V7zm-6 3H9v7h4v-7zm-6 2H3v5h4v-5z" />
  </svg>
);
const IconAccountBalance = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M6.5 10h-2v7h2v-7zm6 0h-2v7h2v-7zm8.5 9H2v2h19v-2zm-2.5-9h-2v7h2v-7zM11.5 1L2 6v2h19V6l-9.5-5z" />
  </svg>
);
const IconCalendar = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
  </svg>
);
const IconBolt = (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
  </svg>
);

/* ── Préstamo MÁS / Full Revenue Loans card ── */
function FullRevenueCard({ maxAmount, baseAmount }: { maxAmount: number; baseAmount: number }) {
  return (
    <Link
      href="/full-revenue/apply"
      className="bg-black text-white rounded-[8px] pt-6 pb-5 px-5 flex flex-col gap-5 relative overflow-hidden hover:opacity-95 transition-opacity cursor-pointer"
    >
      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-2 py-0.5 rounded-full">
          Nuevo
        </span>
        <span className="text-[12px] text-white/60">Financiamiento MÁS</span>
      </div>

      {/* Amount */}
      <div>
        <p className="text-[13px] text-white/60 leading-[20px] mb-1">Hasta</p>
        <p className="text-[32px] leading-[40px] font-bold text-white">
          {formatMxn(maxAmount)}
        </p>
        <p className="text-[12px] text-white/50 mt-1">
          vs {formatMxn(baseAmount)} con tu oferta actual
        </p>
      </div>

      {/* Value props */}
      <div className="flex flex-col gap-3">
        <FeaturePill icon={IconBarChart} text="Evaluamos el 100% de tus ingresos reales" />
        <FeaturePill icon={IconAccountBalance} text="Hasta 4x más que tu oferta en plataforma" />
        <FeaturePill icon={IconCalendar} text="Cuota mensual fija — sin retención sorpresa" />
        <FeaturePill icon={IconBolt} text="Respuesta rápida por email o WhatsApp" />
      </div>

      {/* CTA */}
      <div className="w-full h-11 bg-white text-black text-[15px] font-bold rounded-[2px] flex items-center justify-center gap-2 mt-1">
        Ver mi oferta ampliada
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
        </svg>
      </div>
    </Link>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 h-5 flex-shrink-0 text-white/70">{icon}</span>
      <span className="text-[14px] font-medium text-white/80 leading-[20px]">{text}</span>
    </div>
  );
}

/* ── RBF Offer Card ── */
function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-3 py-4 text-[14px] leading-4 tracking-[0.03em] transition-colors",
        active
          ? "font-bold text-black after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-black"
          : "font-normal text-uber-gray-500 hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function OfferCard({
  offer,
  onSelect,
}: {
  offer: RbfOffer;
  onSelect: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E8E8E8] rounded-[8px] pt-[24px] pb-[16px] px-[16px] flex flex-col gap-[24px]">
      {/* Recibe + monto + descripción */}
      <div className="flex flex-col gap-2">
        <p className="text-[16px] text-[#8A8A8A] leading-[20px]">Recibe</p>
        <p className="text-[24px] leading-[32px] font-bold text-black">
          {formatMxn(offer.receive)}
        </p>
        <p className="text-[16px] text-black leading-[24px] mt-1">
          Retenemos el{" "}
          <strong className="font-bold">{offer.retention}% de tus ventas</strong>{" "}
          realizadas en la aplicación de Uber Eats hasta que pagues{" "}
          <strong className="font-bold">{formatMxn(offer.totalToPay)}</strong>
        </p>
      </div>

      {/* Accordion Detalles */}
      <div>
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="w-full bg-[#E8E8E8] rounded-[8px] px-[8px] py-[8px] flex items-center justify-between text-[14px] font-medium text-black"
        >
          <span>Detalles</span>
          <svg
            className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        {detailsOpen && (
          <div className="flex flex-col divide-y divide-[#D9D9D9]">
            <DetailRow label="Cargo fijo + IVA:" value={formatMxn(offer.fixedFee)} />
            <DetailRow label="Total a pagar:" value={formatMxn(offer.totalToPay)} />
            <DetailRow label="Pago mínimo mensual:" value={formatMxn(offer.monthlyMin)} />
            <DetailRow label="Plazo máximo:" value={offer.maxTerm} />
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full h-[40px] bg-black text-white text-[16px] font-bold rounded-[2px] hover:bg-[#333] transition-colors mt-auto"
      >
        Seleccionar
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-[8px] text-[14px]">
      <span className="text-[#4B4B4B]">{label}</span>
      <span className="font-bold text-black">{value}</span>
    </div>
  );
}

export default function FinanciamientoPage() {
  return (
    <Suspense>
      <FinanciamientoInner />
    </Suspense>
  );
}
