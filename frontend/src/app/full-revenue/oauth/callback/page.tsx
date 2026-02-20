"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

// Esta ruta ya no se usa — OAuth fue reemplazado por Google Places API.
// Redirigir siempre al formulario de solicitud.
export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/full-revenue/apply");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500">Redirigiendo...</p>
    </div>
  );
}
