"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { EVENTS, DEMO_MERCHANT_ID } from "@/lib/tracking";
import { useTracking } from "@/hooks/useTracking";
import { StepIndicator } from "./StepIndicator";
import { Step1Identity } from "./Step1Identity";
import { Step2Revenue } from "./Step2Revenue";
import { Step3Consent } from "./Step3Consent";
import type { Step1Values, Step2Values, Step3Values } from "@/lib/validation";
import type { AllFormData } from "@/types/application";

type PartialForm = Partial<Step1Values> & Partial<Step2Values>;

const TOTAL_STEPS = 3;

export function ApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useTracking();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PartialForm>({});
  const [applicationId, setApplicationId] = useState<string | null>(
    searchParams.get("appId")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social OAuth state
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookToken, setFacebookToken] = useState<string>("");

  // Detectar retorno desde OAuth de Facebook
  useEffect(() => {
    const fbStatus = searchParams.get("facebook");
    const fbToken = searchParams.get("fb_token");
    const appId = searchParams.get("appId");

    if (fbStatus === "connected" && fbToken) {
      setFacebookConnected(true);
      setInstagramConnected(true); // Instagram usa el mismo token de Facebook
      setFacebookToken(fbToken);
      if (appId) {
        setApplicationId(appId);
        setCurrentStep(3);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStep1Complete = useCallback(
    async (data: Step1Values) => {
      setFormData((prev) => ({ ...prev, ...data }));
      setError(null);

      if (!applicationId) {
        try {
          const result = await api.createApplication(DEMO_MERCHANT_ID);
          setApplicationId(result.id);
          trackEvent(EVENTS.FORM_STARTED, { application_id: result.id });
        } catch {
          setError("Error al iniciar la solicitud. Intentá de nuevo.");
          return;
        }
      }

      trackEvent(EVENTS.STEP_COMPLETED, { step: 1 });
      setCurrentStep(2);
    },
    [applicationId, trackEvent]
  );

  const handleStep2Complete = useCallback(
    (data: Step2Values) => {
      setFormData((prev) => ({ ...prev, ...data }));
      trackEvent(EVENTS.STEP_COMPLETED, { step: 2 });
      setCurrentStep(3);
    },
    [trackEvent]
  );

  // Redirige al OAuth de Facebook (también trae Instagram)
  const handleFacebookConnect = useCallback(() => {
    if (!applicationId) {
      setError("Primero completá el paso 1.");
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    window.location.href = `${apiUrl}/full-revenue/oauth/facebook/redirect?applicationId=${applicationId}`;
  }, [applicationId]);

  // Instagram usa el mismo flujo que Facebook (Graph API)
  const handleInstagramConnect = useCallback(() => {
    handleFacebookConnect();
  }, [handleFacebookConnect]);

  const handleStep3Complete = useCallback(
    async (data: Step3Values) => {
      if (!applicationId) return;

      setIsSubmitting(true);
      setError(null);

      const allData: AllFormData = {
        ...(formData as Step1Values & Step2Values),
        ...data,
        // Incluir tokens OAuth si están disponibles
        ...(facebookToken ? {
          facebook_access_token: facebookToken,
          instagram_access_token: facebookToken, // mismo token
        } : {}),
      };

      try {
        await api.submitApplication(applicationId, allData);
        trackEvent(EVENTS.FORM_SUBMITTED, { application_id: applicationId });
        router.push(`/full-revenue/status/${applicationId}`);
      } catch {
        setError("Error al enviar la solicitud. Intentá de nuevo.");
        setIsSubmitting(false);
      }
    },
    [formData, applicationId, facebookToken, router, trackEvent]
  );

  return (
    <div className="px-4 py-6">
      <StepIndicator current={currentStep} total={TOTAL_STEPS} />

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <Step1Identity
          defaultValues={formData}
          onComplete={handleStep1Complete}
        />
      )}
      {currentStep === 2 && (
        <Step2Revenue
          defaultValues={formData}
          onComplete={handleStep2Complete}
          onBack={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 3 && applicationId && (
        <Step3Consent
          applicationId={applicationId}
          onComplete={handleStep3Complete}
          onBack={() => setCurrentStep(2)}
          isSubmitting={isSubmitting}
          facebookConnected={facebookConnected}
          instagramConnected={instagramConnected}
          onFacebookConnect={handleFacebookConnect}
          onInstagramConnect={handleInstagramConnect}
        />
      )}
    </div>
  );
}
