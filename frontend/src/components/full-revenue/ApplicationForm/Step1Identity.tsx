"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, Step1Values } from "@/lib/validation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues: Partial<Step1Values>;
  onComplete: (data: Step1Values) => void;
}

export function Step1Identity({ defaultValues, onComplete }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-6">
      <div>
        <h2 className="text-h2 text-black mb-2">Datos del negocio</h2>
        <p className="text-[14px] text-uber-gray-700 leading-5">
          Necesitamos esta información para iniciar la evaluación de tu
          solicitud de préstamo con R2 Capital Technologies MX.
        </p>
      </div>

      <Input
        label="Email de contacto"
        type="email"
        placeholder="nombre@empresa.com"
        hint="Te enviaremos actualizaciones del estado de tu solicitud a este correo."
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Razón social"
        placeholder="Ej: Restaurante El Buen Sabor S.A. de C.V."
        error={errors.legal_name?.message}
        {...register("legal_name")}
      />

      <Input
        label="Domicilio fiscal"
        placeholder="Calle, número, colonia, ciudad, C.P."
        error={errors.address?.message}
        {...register("address")}
      />

      <Input
        label="Teléfono de contacto"
        type="tel"
        placeholder="Ej: 55 1234 5678 o +52 55 1234 5678"
        hint="Usado para verificar tu identidad vía Twilio."
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Button type="submit" fullWidth size="lg">
        Continuar
      </Button>
    </form>
  );
}
