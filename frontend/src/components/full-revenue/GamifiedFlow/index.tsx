"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { EVENTS, DEMO_MERCHANT_ID } from "@/lib/tracking";
import { useTracking } from "@/hooks/useTracking";
import { Step1Identity } from "../ApplicationForm/Step1Identity";
import { StepConsentSocial, ConsentSocialData } from "./StepConsentSocial";
import { StepFiscal } from "./StepFiscal";
import { OfferRevealCard } from "./OfferRevealCard";
import { GamifiedProgressBar, FlowStep } from "./GamifiedProgressBar";
import { OfferCalculatingLoader } from "./OfferCalculatingLoader";
import type { Step1Values, FiscalValues } from "@/lib/validation";
import type { AllFormData } from "@/types/application";

/* ── Session storage keys ── */
const SS_FORM_DATA   = "fr_form_data";
const SS_GOOGLE_URL  = "fr_google_url";
const SS_FLOW_STEP   = "fr_gflow_step";
const SS_APP_ID      = "fr_app_id";
const SS_FB_TOKEN    = "fr_fb_token";
const SS_FISCAL      = "fr_fiscal_data";
const SS_PREFILL     = "fr_prefill";

/* ── Default offer amounts ── */
const SS_BASE_AMOUNT = "fr_base_amount";
const FALLBACK_BASE  = 50_000;

/** Extrae los campos relevantes del prefill para Step1Identity. */
function readPrefillForStep1(): Partial<Step1Values> {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(SS_PREFILL);
  if (!raw) return {};
  try {
    const p = JSON.parse(raw) as Record<string, string | undefined>;
    const out: Partial<Step1Values> = {};
    if (p.email)      out.email = p.email;
    if (p.legal_name) out.legal_name = p.legal_name;
    if (p.address)    out.address = p.address;
    if (p.phone)      out.phone = p.phone;
    if (p.tax_id)     out.tax_id = p.tax_id;
    return out;
  } catch {
    return {};
  }
}

function readBaseAmount(): number {
  if (typeof window === "undefined") return FALLBACK_BASE;
  const stored = sessionStorage.getItem(SS_BASE_AMOUNT);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return FALLBACK_BASE;
}

export function GamifiedApplicationForm() {
  const searchParams = useSearchParams();
  const { trackEvent } = useTracking();

  /* ── State ── */
  const [flowStep, setFlowStep] = useState<FlowStep>("identity");

  const [step1Data, setStep1Data] = useState<Partial<Step1Values>>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SS_FORM_DATA);
      if (saved) {
        try {
          return { ...readPrefillForStep1(), ...JSON.parse(saved) };
        } catch { /* ignore */ }
      }
      return readPrefillForStep1();
    }
    return {};
  });

  const [fiscalData, setFiscalData] = useState<FiscalValues | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SS_FISCAL);
      if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
    }
    return null;
  });

  const [googleUrl, setGoogleUrl]     = useState<string>("");
  const [applicationId, setApplicationId] = useState<string | null>(() => {
    const fromUrl = searchParams.get("appId");
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") return sessionStorage.getItem(SS_APP_ID);
    return null;
  });

  const [facebookConnected,  setFacebookConnected]  = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookToken,      setFacebookToken]      = useState<string>("");

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [calculatingFor, setCalculatingFor] = useState<"social" | "fiscal" | null>(null);
  const [isEvaluating, setIsEvaluating]     = useState(false);

  // SSR-safe: initialize with fallback, update from sessionStorage after hydration
  const [offerAmounts, setOfferAmounts] = useState({
    base:   FALLBACK_BASE,
    social: Math.round(FALLBACK_BASE * 1.5),
    fiscal: Math.round(FALLBACK_BASE * 3),
  });

  /* ── Hydrate from sessionStorage after mount (SSR-safe) ── */
  useEffect(() => {
    const base = readBaseAmount();
    if (base !== FALLBACK_BASE) {
      setOfferAmounts({
        base,
        social: Math.round(base * 1.5),
        fiscal: Math.round(base * 3),
      });
    }
    const savedStep = sessionStorage.getItem(SS_FLOW_STEP);
    if (savedStep) setFlowStep(savedStep as FlowStep);

    const savedUrl = sessionStorage.getItem(SS_GOOGLE_URL);
    if (savedUrl) setGoogleUrl(savedUrl);

    const savedToken = sessionStorage.getItem(SS_FB_TOKEN);
    if (savedToken) {
      setFacebookToken(savedToken);
      setFacebookConnected(true);
      setInstagramConnected(true);
    }
  }, []);

  /* ── Persist flow step + track step view for funnel metrics ── */
  useEffect(() => {
    if (typeof window !== "undefined") sessionStorage.setItem(SS_FLOW_STEP, flowStep);
    trackEvent(EVENTS.STEP_VIEWED, { step: flowStep });
  }, [flowStep, trackEvent]);

  /* ── Restore state after Facebook OAuth redirect ── */
  useEffect(() => {
    const fbStatus = searchParams.get("facebook");
    const fbToken  = searchParams.get("fb_token");
    const appId    = searchParams.get("appId");

    const fbError = searchParams.get("fb_error");
    if (fbError) {
      setError("Error al conectar Facebook: " + fbError);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      setFlowStep("consent_social");
      return;
    }

    if (fbStatus === "connected" && fbToken) {
      setFacebookConnected(true);
      setInstagramConnected(true);
      setFacebookToken(fbToken);
      if (appId) {
        setApplicationId(appId);
        sessionStorage.setItem(SS_APP_ID, appId);
      }
      sessionStorage.setItem(SS_FB_TOKEN, fbToken);

      const saved = sessionStorage.getItem(SS_FORM_DATA);
      if (saved) { try { setStep1Data(JSON.parse(saved)); } catch { /* ignore */ } }

      const savedUrl = sessionStorage.getItem(SS_GOOGLE_URL) ?? "";
      setGoogleUrl(savedUrl);

      setFlowStep("consent_social");

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ── */
  const createNewApplication = useCallback(async (): Promise<string | null> => {
    try {
      const result = await api.createApplication(DEMO_MERCHANT_ID);
      setApplicationId(result.id);
      sessionStorage.setItem(SS_APP_ID, result.id);
      if (!sessionStorage.getItem("fr_started_at")) {
        sessionStorage.setItem("fr_started_at", Date.now().toString());
      }
      trackEvent(EVENTS.FORM_STARTED, { application_id: result.id });
      return result.id;
    } catch {
      setError("Error al iniciar la solicitud. Intentá de nuevo.");
      return null;
    }
  }, [trackEvent]);

  /* ── Core submit function ── */
  async function doSubmit({ withSocial, withFiscal }: { withSocial: boolean; withFiscal: boolean }): Promise<boolean> {
    let appId = applicationId;
    if (!appId) {
      appId = await createNewApplication();
      if (!appId) return false;
    }

    // Stale closure fix: read step1Data from sessionStorage when state was captured before user filled form
    let s1 = step1Data as Step1Values;
    if (!s1.address || !s1.email) {
      const saved = sessionStorage.getItem(SS_FORM_DATA);
      if (saved) { try { s1 = JSON.parse(saved) as Step1Values; } catch { /* ignore */ } }
    }

    if (!s1.address || !s1.email) {
      setError("Volvé a ingresar los datos de tu negocio para continuar con tu solicitud.");
      setFlowStep("identity");
      return false;
    }

    const fbTok = facebookToken || (typeof window !== "undefined" ? sessionStorage.getItem(SS_FB_TOKEN) ?? "" : "");
    const resolvedGoogleUrl = googleUrl || (typeof window !== "undefined" ? sessionStorage.getItem(SS_GOOGLE_URL) ?? "" : "");

    // Stale closure fix: read fiscalData from sessionStorage when state was captured before user filled fiscal form
    let resolvedFiscalData = fiscalData;
    if (withFiscal && !resolvedFiscalData) {
      const saved = sessionStorage.getItem(SS_FISCAL);
      if (saved) { try { resolvedFiscalData = JSON.parse(saved); } catch { /* ignore */ } }
    }

    const allData: AllFormData = {
      ...s1,
      legal_name: s1.legal_name?.trim() || "NA",
      ...(withFiscal && resolvedFiscalData ? { ciec: resolvedFiscalData.ciec } : {}),
      ...(withSocial && resolvedGoogleUrl ? { google_business_url: resolvedGoogleUrl } : {}),
      ...(withSocial && fbTok ? {
        facebook_access_token: fbTok,
        instagram_access_token: fbTok,
      } : {}),
      consent_given: true,
    };

    try {
      await api.submitApplication(appId, allData);
      sessionStorage.setItem("fr_offer_amounts", JSON.stringify(offerAmounts));
      sessionStorage.setItem("fr_approved_at", Date.now().toString());
      sessionStorage.removeItem(SS_APP_ID);
      sessionStorage.removeItem(SS_FORM_DATA);
      sessionStorage.removeItem(SS_GOOGLE_URL);
      sessionStorage.removeItem(SS_FLOW_STEP);
      sessionStorage.removeItem(SS_FB_TOKEN);
      sessionStorage.removeItem(SS_FISCAL);
      trackEvent(EVENTS.FORM_SUBMITTED, { application_id: appId });
      setIsEvaluating(true);
      return true;
    } catch (err) {
      const isNotFound = err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404;
      if (isNotFound) {
        try {
          const newId = await createNewApplication();
          if (!newId) return false;
          await api.submitApplication(newId, allData);
          sessionStorage.removeItem(SS_APP_ID);
          sessionStorage.removeItem(SS_FORM_DATA);
          sessionStorage.removeItem(SS_GOOGLE_URL);
          sessionStorage.removeItem(SS_FLOW_STEP);
          sessionStorage.removeItem(SS_FB_TOKEN);
          sessionStorage.removeItem(SS_FISCAL);
          trackEvent(EVENTS.FORM_SUBMITTED, { application_id: newId });
          setIsEvaluating(true);
          return true;
        } catch { /* fall through */ }
      }
      const apiErr = err as { message?: string; details?: Array<{ field: string; message: string }> };
      const details = apiErr?.details?.map((d) => `${d.field}: ${d.message}`).join(", ");
      const msg = details ? `${apiErr.message} (${details})` : (apiErr?.message ?? "Error desconocido");
      setError(`Error: ${msg}`);
      return false;
    }
  }

  /* ── Step handlers ── */

  // 1. Identity → ConsentSocial
  const handleIdentityComplete = useCallback(async (data: Step1Values) => {
    setStep1Data(data);
    sessionStorage.setItem(SS_FORM_DATA, JSON.stringify(data));
    setError(null);
    if (!applicationId) {
      const newId = await createNewApplication();
      if (!newId) return;
    }
    trackEvent(EVENTS.STEP_COMPLETED, { step: "identity" });
    setFlowStep("consent_social");
  }, [applicationId, createNewApplication, trackEvent]);

  // 2. ConsentSocial → Offer1
  const handleConsentSocialComplete = useCallback(async (data: ConsentSocialData) => {
    setGoogleUrl(data.google_business_url);
    sessionStorage.setItem(SS_GOOGLE_URL, data.google_business_url);
    setIsSubmitting(true);
    setError(null);

    let appId = applicationId;
    if (!appId) {
      appId = await createNewApplication();
      if (!appId) { setIsSubmitting(false); return; }
    }

    await Promise.allSettled([
      api.submitConsent(appId, {
        bureau_consent: true,
        twilio_consent: true,
        data_processing_consent: true,
      }),
      api.prequalify(appId),
    ]);

    const base = readBaseAmount();
    setOfferAmounts({
      base,
      social: Math.round(base * 1.5),
      fiscal: Math.round(base * 3),
    });

    setIsSubmitting(false);
    trackEvent(EVENTS.STEP_COMPLETED, { step: "consent_social" });
    setCalculatingFor("social");
  }, [applicationId, createNewApplication, trackEvent]);

  // 3a. Offer1 → Apply now
  const handleApplyFromOffer1 = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const submitted = await doSubmit({ withSocial: true, withFiscal: false });
    if (!submitted) setIsSubmitting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3b. Offer1 → Continue to fiscal
  const handleContinueToFiscal = useCallback(() => {
    trackEvent(EVENTS.STEP_COMPLETED, { step: "offer1_continue" });
    setFlowStep("fiscal");
  }, [trackEvent]);

  // 4. Facebook OAuth — opens in popup to keep user in the flow
  const handleFacebookConnect = useCallback((currentUrl: string) => {
    if (!applicationId) { setError("Primero completá los datos del negocio."); return; }
    sessionStorage.setItem(SS_FORM_DATA, JSON.stringify(step1Data));
    sessionStorage.setItem(SS_GOOGLE_URL, currentUrl);
    sessionStorage.setItem(SS_FLOW_STEP, "consent_social");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/full-revenue";
    const oauthUrl = `${apiUrl}/oauth/facebook/redirect?applicationId=${applicationId}`;

    // Try popup first to avoid leaving the flow
    const w = 600, h = 700;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top  = Math.max(0, (window.screen.height - h) / 2);
    const popup = window.open(
      oauthUrl,
      "fb_oauth",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      // Popup blocked — fallback to full redirect
      window.location.href = oauthUrl;
      return;
    }

    // Poll popup URL until it returns to our domain with the token
    const poll = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(poll);
        return;
      }
      try {
        const href = popup.location.href; // throws CORS while on Facebook
        if (!href || href === "about:blank") return;

        const url = new URL(href);
        const fbStatus = url.searchParams.get("facebook");
        const fbToken  = url.searchParams.get("fb_token");
        const appId    = url.searchParams.get("appId");
        const fbError  = url.searchParams.get("fb_error");

        clearInterval(poll);
        popup.close();

        if (fbError) {
          setError("Error al conectar Facebook: " + fbError);
          return;
        }
        if (fbStatus === "connected" && fbToken) {
          setFacebookConnected(true);
          setInstagramConnected(true);
          setFacebookToken(fbToken);
          sessionStorage.setItem(SS_FB_TOKEN, fbToken);
          if (appId) {
            setApplicationId(appId);
            sessionStorage.setItem(SS_APP_ID, appId);
          }
        }
      } catch {
        // CORS — popup still on Facebook's domain, keep polling
      }
    }, 500);
  }, [applicationId, step1Data]);

  const handleInstagramConnect = useCallback(
    (currentUrl: string) => handleFacebookConnect(currentUrl),
    [handleFacebookConnect]
  );

  // 5. Fiscal → Offer2 (final)
  const handleFiscalComplete = useCallback(async (data: FiscalValues) => {
    setFiscalData(data);
    sessionStorage.setItem(SS_FISCAL, JSON.stringify(data));
    trackEvent(EVENTS.STEP_COMPLETED, { step: "fiscal" });
    setCalculatingFor("fiscal");
  }, [trackEvent]);

  // 6. Offer2 → Apply (final)
  const handleApplyFinal = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const submitted = await doSubmit({ withSocial: true, withFiscal: true });
    if (!submitted) setIsSubmitting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Back navigation ── */
  function handleBack() {
    const backMap: Partial<Record<FlowStep, FlowStep>> = {
      consent_social: "identity",
      offer1:         "consent_social",
      fiscal:         "offer1",
      offer2:         "fiscal",
    };
    const prev = backMap[flowStep];
    if (prev) setFlowStep(prev);
  }

  function handleCalculatingDone() {
    const nextStep: FlowStep = calculatingFor === "social" ? "offer1" : "offer2";
    setFlowStep(nextStep);
    setCalculatingFor(null);
  }

  /* ── Render ── */
  const showBack = flowStep !== "identity" && calculatingFor === null;

  // ── Fake door: evaluating screen ──
  if (isEvaluating) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-8 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-[22px] font-bold text-black leading-tight">¡Solicitud recibida!</h2>
          <p className="text-[15px] text-uber-gray-700 leading-relaxed">
            Estamos evaluando tu solicitud. Te contactaremos en las próximas{" "}
            <span className="font-semibold text-black">48 horas</span> con los próximos pasos.
          </p>
          {step1Data.email && (
            <p className="text-[13px] text-uber-gray-500 mt-1">
              Te escribiremos a{" "}
              <span className="font-semibold text-black">{step1Data.email}</span>
            </p>
          )}
        </div>

        <div className="w-full bg-uber-gray-100 rounded-xl p-4 text-left space-y-3 max-w-sm">
          <p className="text-[13px] font-semibold text-black">¿Qué sigue?</p>
          <div className="space-y-2.5">
            {[
              "Un analista de R2 Capital revisará tu solicitud",
              "Te confirmaremos el monto aprobado por email",
              "Si es aprobado, te guiaremos con los documentos finales",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-uber-gray-700 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <a
          href="/offers"
          className="text-[14px] text-uber-gray-500 underline underline-offset-2 hover:text-black transition-colors"
        >
          Volver a Financiamiento
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-4">
      <div className="mb-6">
        <GamifiedProgressBar
          current={flowStep}
          onBack={showBack ? handleBack : undefined}
          offerAmounts={{
            social: offerAmounts.social,
            fiscal: offerAmounts.fiscal,
          }}
        />
      </div>

      {calculatingFor !== null && (
        <OfferCalculatingLoader stage={calculatingFor} onDone={handleCalculatingDone} />
      )}

      {calculatingFor === null && error && (
        <div className="mb-5 p-3 bg-uber-danger-bg border border-uber-danger/30 rounded-btn text-uber-danger text-[14px]">
          {error}
        </div>
      )}

      {/* ── Step 1: Identity ── */}
      {calculatingFor === null && flowStep === "identity" && (
        <Step1Identity
          defaultValues={step1Data}
          onComplete={handleIdentityComplete}
        />
      )}

      {/* ── Step 2: ConsentSocial (bureau + twilio + Google Maps + FB/IG) ── */}
      {calculatingFor === null && flowStep === "consent_social" && (
        <StepConsentSocial
          onComplete={handleConsentSocialComplete}
          isLoading={isSubmitting}
          facebookConnected={facebookConnected}
          instagramConnected={instagramConnected}
          onFacebookConnect={handleFacebookConnect}
          onInstagramConnect={handleInstagramConnect}
          defaultGoogleUrl={googleUrl}
        />
      )}

      {/* ── Offer 1 (1.5x) ── */}
      {calculatingFor === null && flowStep === "offer1" && (
        <div className="space-y-4">
          <OfferRevealCard
            amount={offerAmounts.social}
            previousAmount={offerAmounts.base}
            stage="social"
            isAnimating={true}
          />

          <button type="button" onClick={handleContinueToFiscal} disabled={isSubmitting}
            className="w-full bg-black text-white font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40 inline-flex items-center justify-center gap-2">
            Ampliar el monto con datos fiscales
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <button type="button" onClick={handleApplyFromOffer1} disabled={isSubmitting}
            className="w-full bg-white border-2 border-black text-black font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40">
            {isSubmitting ? "Enviando..." : "Aplicar con este monto"}
          </button>
        </div>
      )}

      {/* ── Step 3: Fiscal (RFC + CIEC) ── */}
      {calculatingFor === null && flowStep === "fiscal" && (
        <StepFiscal
          onComplete={handleFiscalComplete}
          onBack={() => setFlowStep("offer1")}
          isLoading={isSubmitting}
        />
      )}

      {/* ── Offer 2 (3x, final) ── */}
      {calculatingFor === null && flowStep === "offer2" && (
        <div className="space-y-4">
          <OfferRevealCard
            amount={offerAmounts.fiscal}
            previousAmount={offerAmounts.social}
            baseAmount={offerAmounts.base}
            stage="final"
            isAnimating={true}
          />

          <button type="button" onClick={handleApplyFinal} disabled={isSubmitting}
            className="w-full bg-black text-white font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40">
            {isSubmitting ? "Enviando..." : "Aplicar al préstamo"}
          </button>
        </div>
      )}
    </div>
  );
}
