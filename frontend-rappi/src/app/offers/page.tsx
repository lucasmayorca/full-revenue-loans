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
    receive: 62800,
    retention: 32.92,
    totalToPay: 81740,
    fixedFee: 18940,
    monthlyMin: 12975,
    maxTerm: "6.3 meses",
  },
  {
    id: "oferta2",
    receive: 43000,
    retention: 24.9,
    totalToPay: 54726,
    fixedFee: 11726,
    monthlyMin: 8700,
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
  const [activeTab, setActiveTab] = useState<TabId>("ofertas");
  const [offers, setOffers] = useState<RbfOffer[]>(DEFAULT_OFFERS);
  const [fullRevenueMax, setFullRevenueMax] = useState<number>(DEFAULT_OFFERS[0].receive * 3);
  const [personaType, setPersonaType] = useState<"fisica" | "moral">("fisica");
  const [consentChecked, setConsentChecked] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);

  // Hidratar ofertas + prefill desde ?t=token
  useEffect(() => {
    const token = searchParams.get("t");
    if (!token) return;

    setPrefillLoading(true);
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
          setFullRevenueMax(baseAmount * 3);
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
      .finally(() => setPrefillLoading(false));
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
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#ADADAD" }}>
          Financiamiento
        </p>
        <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-tight" style={{ color: "#1A1A1A" }}>
          {merchantName ? `Hola, ${merchantName} 👋` : "Préstamos para ti"}
        </h1>
      </div>

      {prefillLoading && (
        <div className="mb-4 p-3 bg-uber-gray-100 border border-uber-gray-200 rounded-card text-[13px] text-uber-gray-700">
          Cargando tu oferta personalizada...
        </div>
      )}
      {prefillError && (
        <div className="mb-4 p-3 bg-uber-danger-bg border border-uber-danger/30 rounded-card text-[13px] text-uber-danger">
          {prefillError} Te mostramos las ofertas base.
        </div>
      )}

      {/* Tabs row */}
      <div className="flex items-center justify-between pt-[5px] mb-8" style={{ borderBottom: "1px solid #EDE8E6" }}>
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
          className="border-2 rounded-full px-4 py-2 text-[14px] font-bold transition-colors hover:bg-[#F0F7FF]"
          style={{ borderColor: "#3B82F6", color: "#3B82F6" }}
        >
          Dar Sugerencias
        </button>
      </div>

      {activeTab === "ofertas" && (
        <div className="flex flex-col gap-10">
          {/* ── Productos disponibles (Full Revenue + 2 RBF) ── */}
          <div>
            <div className="mb-5">
              <h2 className="text-[22px] font-bold leading-[1.2]" style={{ color: "#1A1A1A" }}>
                Elige la oferta que más te convenga
              </h2>
            </div>

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
                  className="w-5 h-5 accent-[#3B82F6]"
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
                  className="w-5 h-5 accent-[#3B82F6]"
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
              className="mt-1 w-[18px] h-[18px] accent-[#3B82F6] flex-shrink-0"
            />
            <span className="text-[12px] leading-5 text-uber-gray-700">
              Autorizo a Rappi a compartir con{" "}
              <strong className="text-black">
                R2 CAPITAL TECHNOLOGIES MX S.A. DE C.V.
              </strong>{" "}
              la información de mi negocio (incluyendo datos financieros, de
              contacto y personales) con fines de elegibilidad para el
              otorgamiento de un crédito. Lo anterior, de acuerdo con la{" "}
              <a className="underline font-bold" style={{ color: "#3B82F6" }} href="#">
                Autorización para compartir datos personales
              </a>{" "}
              y los{" "}
              <a className="underline font-bold" style={{ color: "#3B82F6" }} href="#">
                Términos y Condiciones
              </a>
              .
            </span>
          </label>

          {/* Survey accordion */}
          <div className="border border-[#E8E8E8] rounded-card overflow-hidden">
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
                  className="w-full h-24 p-3 border border-uber-gray-300 rounded-btn text-[14px] resize-none focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab !== "ofertas" && (
        <div className="py-20 text-center">
          <p className="text-[16px] text-uber-gray-500">
            Esta pestaña es parte de la experiencia completa de Rappi
            y no está disponible en este prototipo.
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
      className="text-white rounded-[12px] pt-6 pb-5 px-5 flex flex-col gap-5 relative overflow-hidden cursor-pointer group"
      style={{
        background: "linear-gradient(145deg, #1E40AF 0%, #3B82F6 45%, #60A5FA 100%)",
        boxShadow: "0 8px 32px rgba(59, 130, 246, 0.35)",
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden
        className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -left-6 bottom-0 w-32 h-32 rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.12em] bg-white px-2.5 py-1 rounded-full"
          style={{ color: "#3B82F6" }}
        >
          NUEVO
        </span>
        <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
          Préstamo MÁS
        </span>
      </div>

      {/* Amount */}
      <div className="relative z-10">
        <p className="text-[12px] font-medium text-white/60 leading-[18px] uppercase tracking-wider mb-1">
          Hasta
        </p>
        <p className="text-[36px] leading-[42px] font-extrabold text-white tracking-tight">
          {formatMxn(maxAmount)}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-white/40 text-[11px]">vs</span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
          >
            {formatMxn(baseAmount)} oferta actual
          </span>
        </div>
      </div>

      {/* Value props */}
      <div className="flex flex-col gap-2.5 relative z-10">
        <FeaturePill icon={IconBarChart} text="100% de tus ingresos evaluados" />
        <FeaturePill icon={IconAccountBalance} text="Hasta 4x tu oferta en plataforma" />
        <FeaturePill icon={IconCalendar} text="Cuota fija mensual, sin sorpresas" />
        <FeaturePill icon={IconBolt} text="Respuesta rápida por WhatsApp" />
      </div>

      {/* CTA */}
      <div
        className="w-full h-11 text-[14px] font-bold rounded-[8px] flex items-center justify-center gap-2 mt-1 relative z-10 transition-opacity group-hover:opacity-90"
        style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.35)" }}
      >
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
    <div className="flex items-center gap-2">
      <span className="w-[18px] h-[18px] flex-shrink-0 text-white/60">{icon}</span>
      <span className="text-[13px] font-medium text-white/85 leading-[18px]">{text}</span>
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
          ? "font-bold text-rappi-orange after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-rappi-orange"
          : "font-normal text-uber-gray-500 hover:text-rappi-orange",
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
    <div
      className="bg-white rounded-[12px] pt-0 pb-5 px-5 flex flex-col gap-5 overflow-hidden"
      style={{ boxShadow: "0 1px 8px rgba(23,16,12,0.08), 0 0 0 1px rgba(23,16,12,0.06)" }}
    >
      {/* Blue top accent */}
      <div className="h-[4px] w-full -mx-5 mb-0" style={{ width: "calc(100% + 2.5rem)", marginLeft: "-1.25rem", background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />

      {/* Recibe + monto + descripción */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9E9E9E" }}>
          Recibe
        </p>
        <p className="text-[28px] leading-[34px] font-extrabold tracking-tight" style={{ color: "#1A1A1A" }}>
          {formatMxn(offer.receive)}
        </p>
        <p className="text-[14px] leading-[22px] mt-1" style={{ color: "#5C5C5C" }}>
          Retenemos el{" "}
          <strong className="font-bold" style={{ color: "#1A1A1A" }}>{offer.retention}% de tus ventas</strong>{" "}
          en Rappi hasta pagar{" "}
          <strong className="font-bold" style={{ color: "#1A1A1A" }}>{formatMxn(offer.totalToPay)}</strong>
        </p>
      </div>

      {/* Accordion Detalles */}
      <div>
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="w-full rounded-[8px] px-3 py-2.5 flex items-center justify-between text-[13px] font-semibold transition-colors"
          style={{
            background: detailsOpen ? "#EFF6FF" : "#F5F5F5",
            color: detailsOpen ? "#3B82F6" : "#5C5C5C",
          }}
        >
          <span>Detalles del préstamo</span>
          <svg
            className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        {detailsOpen && (
          <div className="flex flex-col divide-y" style={{ borderColor: "#EDE8E6" }}>
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
        className="w-full h-[42px] text-white text-[14px] font-bold rounded-[8px] transition-all mt-auto"
        style={{ background: "#3B82F6" }}
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
