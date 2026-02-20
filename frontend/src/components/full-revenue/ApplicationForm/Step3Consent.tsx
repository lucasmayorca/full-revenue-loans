"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3Schema, Step3Values } from "@/lib/validation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function HowToTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 focus:outline-none"
        aria-label="Cómo obtener la URL"
      >
        ?
      </button>
      {open && (
        <>
          {/* overlay para cerrar al hacer click fuera */}
          <span
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <span className="absolute left-6 top-0 z-20 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl space-y-2">
            <p className="font-semibold text-white">¿Cómo obtener la URL?</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 leading-relaxed">
              <li>Abrí <span className="text-white font-medium">Google Maps</span> en tu celular o computadora</li>
              <li>Buscá el nombre de tu negocio</li>
              <li>Tocá el nombre para abrir la ficha del negocio</li>
              <li>Tocá <span className="text-white font-medium">Compartir</span> → <span className="text-white font-medium">Copiar enlace</span></li>
              <li>Pegá el enlace acá abajo</li>
            </ol>
            <p className="text-gray-400 pt-1 border-t border-gray-700">
              La URL se ve así:<br />
              <span className="text-gray-300 break-all">google.com/maps/place/Tu+Negocio/...</span>
            </p>
          </span>
        </>
      )}
    </span>
  );
}

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
          <p className="font-medium text-sm text-gray-900 flex items-center">
            Perfil de Google del negocio{" "}
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            <HowToTooltip />
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
