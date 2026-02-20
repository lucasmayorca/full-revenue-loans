"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3Schema, Step3Values } from "@/lib/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  applicationId: string;
  googleConnected: boolean;
  onComplete: (data: Step3Values) => void;
  onBack: () => void;
  isSubmitting: boolean;
  onGoogleConnect: () => void;
}

export function Step3Consent({
  applicationId,
  googleConnected,
  onComplete,
  onBack,
  isSubmitting,
  onGoogleConnect,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { google_connected: googleConnected, google_business_url: "" },
  });

  function onSubmit(data: Step3Values) {
    onComplete({ ...data, google_connected: googleConnected });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Confirmación
        </h2>
        <p className="text-sm text-gray-500">
          Último paso: aceptá los términos y conectá tu presencia digital para mejorar tu evaluación.
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
            Pegá la URL de tu perfil en Google Maps o Google Business para que
            podamos verificar tu negocio y reseñas.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Ej: https://maps.google.com/?cid=123456 o https://g.page/tu-negocio
          </p>
        </div>

        <Input
          label="URL del perfil de Google"
          placeholder="https://maps.google.com/..."
          error={errors.google_business_url?.message}
          {...register("google_business_url")}
        />
      </div>

      {/* Google Account OAuth */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-gray-900">
              Conectar cuenta de Google vinculada al negocio{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Conectá tu cuenta de Google para analizar reseñas, tráfico y tendencias de tu negocio
            </p>
          </div>
        </div>

        {googleConnected ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Cuenta de Google conectada correctamente
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onGoogleConnect}
            disabled={isSubmitting}
          >
            Conectar cuenta de Google del negocio
          </Button>
        )}
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
