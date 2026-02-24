"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { KycForm } from "@/components/full-revenue/KycForm";
import type { Application } from "@/types/application";

interface Props {
  params: { applicationId: string };
}

export default function KycPage({ params }: Props) {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      try {
        const app = await api.getApplication(params.applicationId);
        if (app.decision_status !== "APPROVED" && app.decision_status !== "MANUAL_REVIEW") {
          setError("Esta solicitud no está aprobada para completar KYC.");
          return;
        }
        setApplication(app);
      } catch {
        setError("Solicitud no encontrada.");
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [params.applicationId]);

  if (loading) {
    return (
      <div className="px-4 py-10 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-rappi-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Verificando solicitud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10 flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={() => router.push("/full-revenue/info")}
          className="text-rappi-orange font-semibold text-sm"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!application) return null;

  return (
    <KycForm
      applicationId={params.applicationId}
      prefillData={application.form_data as Record<string, string> | undefined}
    />
  );
}
