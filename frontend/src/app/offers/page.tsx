"use client";

import { useEffect, useState } from "react";
import { PrestamoMasBanner } from "@/components/offers/PrestamoMasBanner";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

type OfferId = "oferta1" | "oferta2" | "oferta3";

interface RbfOffer {
  id: OfferId;
  receive: number;
  retention: number; // %
  totalToPay: number;
  fixedFee: number;
  monthlyMin: number;
  maxTerm: string;
}

const OFFERS: RbfOffer[] = [
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
  {
    id: "oferta3",
    receive: 23600,
    retention: 15.19,
    totalToPay: 29075,
    fixedFee: 5475,
    monthlyMin: 4650,
    maxTerm: "6.3 meses",
  },
];

function formatMxn(value: number) {
  return "$" + value.toLocaleString("en-US");
}

type TabId = "ofertas" | "beneficios" | "como" | "faq";

export default function FinanciamientoPage() {
  const { trackEvent } = useTracking();
  const [activeTab, setActiveTab] = useState<TabId>("ofertas");
  const [expanded, setExpanded] = useState<OfferId | null>("oferta1");
  const [personaType, setPersonaType] = useState<"fisica" | "moral">("fisica");
  const [consentChecked, setConsentChecked] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);

  useEffect(() => {
    trackEvent(EVENTS.OFFERS_PAGE_VIEWED);
    // track each offer card view con el orden de display
    OFFERS.forEach((offer, idx) => {
      trackEvent(EVENTS.OFFER_CARD_VIEWED, {
        offer_id: offer.id,
        position: idx,
        receive_amount: offer.receive,
      });
    });
  }, [trackEvent]);

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
    alert(
      "Esta oferta base no está disponible en el prototipo. Prueba Préstamo MÁS arriba."
    );
  }

  function handleOfferToggle(offerId: OfferId) {
    const wasExpanded = expanded === offerId;
    setExpanded(wasExpanded ? null : offerId);
    trackEvent(EVENTS.OFFER_DETAILS_TOGGLED, {
      offer_id: offerId,
      expanded: !wasExpanded,
    });
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      {/* Title */}
      <h1 className="text-[40px] font-bold text-black leading-[1.1] tracking-tight mb-8">
        Financiamiento
      </h1>

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
          {/* Banner Préstamo MÁS — ARRIBA de las 3 ofertas */}
          <PrestamoMasBanner baseAmount={OFFERS[0].receive} />

          {/* Section title */}
          <div>
            <h2 className="text-h2 text-uber-hero mb-4">
              Seleccione la oferta que mejor se adapte a tus necesidades
            </h2>
            <p className="text-[16px] leading-5 text-uber-gray-700">
              Estas ofertas son calculadas en base a tu historial de ventas con
              Uber Eats para que puedas pagarlas con un porcentaje de tus
              ingresos.
            </p>
          </div>

          {/* 3 cards RBF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OFFERS.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                expanded={expanded === offer.id}
                onToggle={() => handleOfferToggle(offer.id)}
                onSelect={() => handleOfferSelect(offer)}
              />
            ))}
          </div>

          {/* CAT disclosure */}
          <p className="text-[12px] leading-[18px] text-black">
            El promedio del Costo Anual Total (CAT) de las 3 ofertas es [105%]
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
  expanded,
  onToggle,
  onSelect,
}: {
  offer: RbfOffer;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="bg-white border border-uber-gray-200 rounded-card pt-6 pb-4 px-4 flex flex-col gap-6">
      <div>
        <p className="text-[16px] leading-5 text-uber-gray-500">Recibe</p>
        <p className="text-[24px] leading-8 font-bold text-black">
          {formatMxn(offer.receive)}
        </p>
      </div>

      <p className="text-[16px] leading-6 text-black">
        Retenemos el{" "}
        <strong className="font-bold">{offer.retention}% de tus ventas</strong>{" "}
        realizadas en la aplicación de Uber Eats hasta que pagues{" "}
        <strong className="font-bold">{formatMxn(offer.totalToPay)}</strong>
      </p>

      <div className="bg-uber-gray-200 rounded-card p-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-0"
          aria-expanded={expanded}
        >
          <span className="text-[16px] font-bold text-black">Detalles</span>
          <svg
            className={[
              "w-5 h-5 text-black transition-transform",
              expanded ? "rotate-180" : "",
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

        {expanded && (
          <div className="mt-3 flex flex-col">
            <DetailRow label="Cargo fijo + IVA:" value={formatMxn(offer.fixedFee)} />
            <DetailRow label="Total a pagar:" value={formatMxn(offer.totalToPay)} />
            <DetailRow label="Pago mínimo mensual:" value={formatMxn(offer.monthlyMin)} />
            <DetailRow label="Plazo máximo:" value={offer.maxTerm} isLast />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="w-full h-10 bg-black text-white text-[16px] font-bold rounded-btn hover:bg-uber-gray-900 transition-colors"
      >
        Seleccionar
      </button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between py-2",
        isLast ? "" : "border-b border-uber-gray-300",
      ].join(" ")}
    >
      <span className="text-[16px] leading-5 text-uber-gray-700">{label}</span>
      <span className="text-[16px] leading-5 font-medium text-uber-gray-700 text-right">
        {value}
      </span>
    </div>
  );
}
