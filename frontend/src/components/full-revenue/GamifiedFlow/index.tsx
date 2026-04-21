"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { EVENTS, DEMO_MERCHANT_ID } from "@/lib/tracking";
import { useTracking } from "@/hooks/useTracking";
import { Step1Identity } from "../ApplicationForm/Step1Identity";
import { Step2Connections, Step2Result } from "../ApplicationForm/Step2Connections";
import { StepConsent } from "./StepConsent";
import { StepFiscal } from "./StepFiscal";
import { OfferRevealCard } from "./OfferRevealCard";
import { GamifiedProgressBar, FlowStep } from "./GamifiedProgressBar";
import type { Step1Values, FiscalValues } from "@/lib/validation";
import type { AllFormData } from "@/types/application";

/* ── Session storage keys ── */
const SS_FORM_DATA   = "fr_form_data";
const SS_GOOGLE_URL  = "fr_google_url";
const SS_FLOW_STEP   = "fr_gflow_step";
const SS_APP_ID      = "fr_app_id";
const SS_FB_TOKEN    = "fr_fb_token";
const SS_FISCAL      = "fr_fiscal_data";

/* ── Default offer amounts ── */
const DEFAULT_INITIAL      = 50_000;
const DEFAULT_BUREAU_OFFER = 75_000;   // 1.5X
const DEFAULT_SOCIAL_OFFER = 100_000;  // 2X
const DEFAULT_FISCAL_OFFER = 200_000;  // 4X

export function GamifiedApplicationForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useTracking();

  /* ── State ── */
  const [flowStep, setFlowStep] = useState<FlowStep>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SS_FLOW_STEP);
      if (saved) return saved as FlowStep;
    }
    return "identity";
  });

  const [step1Data, setStep1Data] = useState<Partial<Step1Values>>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SS_FORM_DATA);
      if (saved) { try { return JSON.parse(saved); } catch { /* ignore */ } }
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [offerAmounts, setOfferAmounts] = useState({
    base: DEFAULT_INITIAL,
    bureau: DEFAULT_BUREAU_OFFER,
    social: DEFAULT_SOCIAL_OFFER,
    fiscal: DEFAULT_FISCAL_OFFER,
  });

  /* ── Persist flow step + track step view for funnel metrics ── */
  useEffect(() => {
    if (typeof window !== "undefined") sessionStorage.setItem(SS_FLOW_STEP, flowStep);
    trackEvent(EVENTS.STEP_VIEWED, { step: flowStep });
  }, [flowStep, trackEvent]);

  /* ── Restore state after OAuth redirect ── */
  useEffect(() => {
    const fbStatus = searchParams.get("facebook");
    const fbToken  = searchParams.get("fb_token");
    const appId    = searchParams.get("appId");

    // Handle Facebook OAuth error
    const fbError = searchParams.get("fb_error");
    if (fbError) {
      setError("Error al conectar Facebook: " + fbError);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
      setFlowStep("connections");
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

      setFlowStep("connections");

      // Clean up URL params to prevent re-processing on re-renders
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
      // Record flow start time for success page stats
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

  /* ── Step handlers ── */

  // 1. Identity → Consent
  const handleIdentityComplete = useCallback(async (data: Step1Values) => {
    setStep1Data(data);
    sessionStorage.setItem(SS_FORM_DATA, JSON.stringify(data));
    setError(null);
    if (!applicationId) {
      const newId = await createNewApplication();
      if (!newId) return;
    }
    trackEvent(EVENTS.STEP_COMPLETED, { step: "identity" });
    setFlowStep("consent");
  }, [applicationId, createNewApplication, trackEvent]);

  // 2. Consent → Offer1
  const handleConsentComplete = useCallback(async (data: { bureau_consent: true; twilio_consent: true; data_processing_consent: true }) => {
    setIsSubmitting(true);
    setError(null);

    let appId = applicationId;
    if (!appId) {
      appId = await createNewApplication();
      if (!appId) { setIsSubmitting(false); return; }
    }

    const [, prequal] = await Promise.allSettled([
      api.submitConsent(appId, data),
      api.prequalify(appId),
    ]);

    if (prequal.status === "fulfilled") {
      setOfferAmounts({
        base: prequal.value.base_amount,
        bureau: prequal.value.bureau_offer,
        social: prequal.value.social_offer,
        fiscal: prequal.value.fiscal_offer,
      });
    }

    setIsSubmitting(false);
    trackEvent(EVENTS.STEP_COMPLETED, { step: "consent" });
    setFlowStep("offer1");
  }, [applicationId, createNewApplication, trackEvent]);

  // 3a. Offer1 → Apply now
  const handleApplyFromOffer1 = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const submitted = await doSubmit({ withSocial: false, withFiscal: false });
    if (!submitted) setIsSubmitting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3b. Offer1 → Continue to connections
  const handleContinueToConnections = useCallback(() => {
    trackEvent(EVENTS.STEP_COMPLETED, { step: "offer1_continue" });
    setFlowStep("connections");
  }, [trackEvent]);

  // 4. Facebook OAuth
  const handleFacebookConnect = useCallback((currentUrl: string) => {
    if (!applicationId) { setError("Primero completá los datos del negocio."); return; }
    sessionStorage.setItem(SS_FORM_DATA, JSON.stringify(step1Data));
    sessionStorage.setItem(SS_GOOGLE_URL, currentUrl);
    sessionStorage.setItem(SS_FLOW_STEP, "connections");
    // BASE_URL already includes `/full-revenue` prefix — do NOT double it.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/full-revenue";
    window.location.href = `${apiUrl}/oauth/facebook/redirect?applicationId=${applicationId}`;
  }, [applicationId, step1Data]);

  const handleInstagramConnect = useCallback(
    (currentUrl: string) => handleFacebookConnect(currentUrl),
    [handleFacebookConnect]
  );

  // 5. Connections → Offer2
  const handleConnectionsComplete = useCallback(async (data: Step2Result) => {
    setGoogleUrl(data.google_business_url ?? "");
    trackEvent(EVENTS.STEP_COMPLETED, { step: "connections" });
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setFlowStep("offer2");
  }, [trackEvent]);

  // 6a. Offer2 → Apply now
  const handleApplyFromOffer2 = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const submitted = await doSubmit({ withSocial: true, withFiscal: false });
    if (!submitted) setIsSubmitting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 6b. Offer2 → Continue to fiscal
  const handleContinueToFiscal = useCallback(() => {
    trackEvent(EVENTS.STEP_COMPLETED, { step: "offer2_continue" });
    setFlowStep("fiscal");
  }, [trackEvent]);

  // 7. Fiscal → Offer3
  const handleFiscalComplete = useCallback(async (data: FiscalValues) => {
    setFiscalData(data);
    sessionStorage.setItem(SS_FISCAL, JSON.stringify(data));
    trackEvent(EVENTS.STEP_COMPLETED, { step: "fiscal" });
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setFlowStep("offer3");
  }, [trackEvent]);

  // 8. Offer3 → Apply (final) → goes directly to KYC
  const handleApplyFinal = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const submitted = await doSubmit({ withSocial: true, withFiscal: true, goToKyc: true });
    if (!submitted) setIsSubmitting(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Core submit function ── */
  async function doSubmit({ withSocial, withFiscal, goToKyc = false }: { withSocial: boolean; withFiscal: boolean; goToKyc?: boolean }): Promise<boolean> {
    let appId = applicationId;
    if (!appId) {
      appId = await createNewApplication();
      if (!appId) return false;
    }

    const s1 = step1Data as Step1Values;
    if (!s1.legal_name || !s1.address || !s1.email) {
      // Los datos se perdieron (ej: sesión expirada). Mandamos al usuario de
      // vuelta al Step 1 donde los puede recapturar, y mostramos un aviso ahí.
      setError("Volvé a ingresar los datos de tu negocio para continuar con tu solicitud.");
      setFlowStep("identity");
      return false;
    }

    const fbTok = facebookToken || (typeof window !== "undefined" ? sessionStorage.getItem(SS_FB_TOKEN) ?? "" : "");

    const allData: AllFormData = {
      ...s1,
      ...(withFiscal && fiscalData ? { tax_id: fiscalData.tax_id, ciec: fiscalData.ciec } : {}),
      ...(withSocial && googleUrl ? { google_business_url: googleUrl } : {}),
      ...(withSocial && fbTok ? {
        facebook_access_token: fbTok,
        instagram_access_token: fbTok,
      } : {}),
      consent_given: true,
    };

    try {
      await api.submitApplication(appId, allData);
      // Save offer amounts and approval time for success page stats
      sessionStorage.setItem("fr_offer_amounts", JSON.stringify(offerAmounts));
      sessionStorage.setItem("fr_approved_at", Date.now().toString());
      sessionStorage.removeItem(SS_APP_ID);
      sessionStorage.removeItem(SS_FORM_DATA);
      sessionStorage.removeItem(SS_GOOGLE_URL);
      sessionStorage.removeItem(SS_FLOW_STEP);
      sessionStorage.removeItem(SS_FB_TOKEN);
      sessionStorage.removeItem(SS_FISCAL);
      trackEvent(EVENTS.FORM_SUBMITTED, { application_id: appId });
      // Go to KYC if final offer, otherwise to status
      const destination = goToKyc
        ? `/full-revenue/kyc/${appId}`
        : `/full-revenue/status/${appId}`;
      router.push(destination);
      return true;
    } catch (err) {
      const isNotFound = err && typeof err === "object" && "status" in err && (err as {status: number}).status === 404;
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
          const dest = goToKyc
            ? `/full-revenue/kyc/${newId}`
            : `/full-revenue/status/${newId}`;
          router.push(dest);
          return true;
        } catch { /* fall through */ }
      }
      const apiErr = err as { message?: string; details?: Array<{field: string; message: string}> };
      const details = apiErr?.details?.map((d) => `${d.field}: ${d.message}`).join(", ");
      const msg = details ? `${apiErr.message} (${details})` : (apiErr?.message ?? "Error desconocido");
      setError(`Error: ${msg}`);
      return false;
    }
  }

  /* ── Back navigation ── */
  function handleBack() {
    const backMap: Partial<Record<FlowStep, FlowStep>> = {
      consent:     "identity",
      offer1:      "consent",
      connections: "offer1",
      offer2:      "connections",
      fiscal:      "offer2",
      offer3:      "fiscal",
    };
    const prev = backMap[flowStep];
    if (prev) setFlowStep(prev);
  }

  /* ── Render ── */
  const showBack = flowStep !== "identity";

  return (
    <div className="px-4 py-4">
      <div className="mb-6">
        <GamifiedProgressBar
          current={flowStep}
          onBack={showBack ? handleBack : undefined}
          offerAmounts={{
            bureau: offerAmounts.bureau,
            social: offerAmounts.social,
            fiscal: offerAmounts.fiscal,
          }}
        />
      </div>

      {error && (
        <div className="mb-5 p-3 bg-uber-danger-bg border border-uber-danger/30 rounded-btn text-uber-danger text-[14px]">
          {error}
        </div>
      )}

      {/* ── Step: Identity ── */}
      {flowStep === "identity" && (
        <Step1Identity
          defaultValues={step1Data}
          onComplete={handleIdentityComplete}
        />
      )}

      {/* ── Step: Consent (buró + Twilio) ── */}
      {flowStep === "consent" && (
        <StepConsent
          onComplete={handleConsentComplete}
          isLoading={isSubmitting}
        />
      )}

      {/* ── Step: Offer 1 (1.5X) with 2 CTAs — Ampliar es PRIMARY */}
      {flowStep === "offer1" && (
        <div className="space-y-4">
          <OfferRevealCard
            amount={offerAmounts.bureau}
            previousAmount={offerAmounts.base}
            stage="bureau"
            isAnimating={true}
          />

          <button type="button" onClick={handleContinueToConnections} disabled={isSubmitting}
            className="w-full bg-black text-white font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40 inline-flex items-center justify-center gap-2">
            Ampliar el monto con más información
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <button type="button" onClick={handleApplyFromOffer1} disabled={isSubmitting}
            className="w-full bg-white border-2 border-black text-black font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40">
            {isSubmitting ? "Enviando..." : "Aplicar con este monto"}
          </button>

          <p className="text-[12px] text-uber-gray-500 text-center">Sin compromiso hasta que confirmes en el paso de KYC.</p>
        </div>
      )}

      {/* ── Step: Connections ── */}
      {flowStep === "connections" && (
        <Step2Connections
          defaultGoogleUrl={googleUrl}
          facebookConnected={facebookConnected}
          instagramConnected={instagramConnected}
          onFacebookConnect={handleFacebookConnect}
          onInstagramConnect={handleInstagramConnect}
          onComplete={handleConnectionsComplete}
          onBack={() => setFlowStep("offer1")}
          isSubmitting={isSubmitting}
          applicationId={applicationId ?? undefined}
        />
      )}

      {/* ── Step: Offer 2 (2X) with 2 CTAs — Ampliar es PRIMARY */}
      {flowStep === "offer2" && (
        <div className="space-y-4">
          <OfferRevealCard
            amount={offerAmounts.social}
            previousAmount={offerAmounts.bureau}
            stage="social"
            isAnimating={true}
          />

          <button type="button" onClick={handleContinueToFiscal} disabled={isSubmitting}
            className="w-full bg-black text-white font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40 inline-flex items-center justify-center gap-2">
            Ampliar el monto con más información
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <button type="button" onClick={handleApplyFromOffer2} disabled={isSubmitting}
            className="w-full bg-white border-2 border-black text-black font-bold h-12 rounded-btn text-[16px] transition-colors hover:bg-uber-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40">
            {isSubmitting ? "Enviando..." : "Aplicar con este monto"}
          </button>

          <p className="text-[12px] text-uber-gray-500 text-center">Sin compromiso hasta que confirmes en el paso de KYC.</p>
        </div>
      )}

      {/* ── Step: Fiscal (RFC + CIEC + SAT consent) ── */}
      {flowStep === "fiscal" && (
        <StepFiscal
          onComplete={handleFiscalComplete}
          onBack={() => setFlowStep("offer2")}
          isLoading={isSubmitting}
        />
      )}

      {/* ── Step: Offer 3 (4X, final) ── */}
      {flowStep === "offer3" && (
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

          <p className="text-[12px] text-uber-gray-500 text-center">Sin compromiso hasta que confirmes en el paso de KYC.</p>
        </div>
      )}
    </div>
  );
}
