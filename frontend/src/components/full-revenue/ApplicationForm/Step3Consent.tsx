"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3Schema, Step3Values } from "@/lib/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  applicationId: string;
  onComplete: (data: Step3Values) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step3Consent({
  applicationId,
  onComplete,
  onBack,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { google_business_url: "" },
  });

  function onSubmit(data: Step3Values) {
    onComplete(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Confirmación
        </h2>
        <p className="text-sm text-gray-500">
          Último paso: aceptá los términos y sumá tu perfil digital para mejorar tu evaluación.
        </p>
      </div>

      {/* Google Business URL */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
        <div>
          <p className="font-medium text-sm text-gray-900">
            Perfil de Google del negocio{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pegá la URL de tu perfil en Google Maps para que podamos verificar
            tu negocio, rating y reseñas de clientes.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Ej: https://www.google.com/maps/place/Mi+Negocio/...
          </p>
        </div>

        <Input
          label="URL de tu perfil en Google Maps"
          placeholder="https://www.google.com/maps/place/..."
          error={errors.google_business_url?.message}
          {...register("google_business_url")}
        />
      </div>

      {/* Consent checkbox */}
      <Checkbox
        label="Acepto los términos y condiciones del Préstamo MÁS y autorizo el uso de mis datos fiscales y digitales para la evaluación crediticia"
        error={errors.consent_given?.message}
        {...register("consent_given")}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          fullWidth
        >
          Atrás
        </Button>
        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Enviar solicitud
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Solicitud #{applicationId.slice(0, 8).toUpperCase()}
      </p>
    </form>
  );
}
