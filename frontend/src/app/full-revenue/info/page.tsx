"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InfoHero } from "@/components/full-revenue/InfoHero";
import { StepSummary } from "@/components/full-revenue/StepSummary";
import { Button } from "@/components/ui/Button";
import { useTracking } from "@/hooks/useTracking";
import { EVENTS } from "@/lib/tracking";

const STEPS = [
  {
    number: 1,
    title: "Completá tus datos",
    description: "Información legal y fiscal de tu negocio",
  },
  {
    number: 2,
    title: "Declaración de ventas",
    description: "Fuentes y estimación mensual de tus ventas totales",
  },
  {
    number: 3,
    title: "Conectá tu cuenta",
    description: "Vinculá Google para analizar reseñas y tendencias de tu negocio",
  },
  {
    number: 4,
    title: "Aprobación de nuevo monto",
    description: "Recibís la aprobación de tu Préstamo MÁS con hasta 5x el monto preaprobado",
  },
];

export default function FullRevenueInfoPage() {
  const router = useRouter();
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent(EVENTS.PRODUCT_PAGE_VIEWED);
  }, [trackEvent]);

  function handleContinue() {
    trackEvent(EVENTS.CONTINUE_CLICKED);
    router.push("/full-revenue/apply");
  }

  return (
    <div className="px-4 py-8 space-y-8">
      <InfoHero />
      <StepSummary steps={STEPS} />

      <div className="pb-6">
        <Button onClick={handleContinue} fullWidth size="lg">
          Continuar
        </Button>
        <p className="text-xs text-gray-400 text-center mt-3">
          Sin compromiso. El proceso toma menos de 5 minutos.
        </p>
      </div>
    </div>
  );
}
