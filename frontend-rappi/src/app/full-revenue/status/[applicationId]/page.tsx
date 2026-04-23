"use client";

import { useParams } from "next/navigation";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import { StatusCard } from "@/components/full-revenue/status/StatusCard";
import { Spinner } from "@/components/ui/Spinner";

export default function StatusPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const { application, error, isLoading } = useApplicationStatus(applicationId);

  // Cargando datos del servidor (primera petición)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-gray-500">Cargando estado de tu solicitud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Revisá tu conexión e intentá recargar la página.
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-gray-500">Procesando...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-md mx-auto w-full">
      <StatusCard application={application} />
    </div>
  );
}
