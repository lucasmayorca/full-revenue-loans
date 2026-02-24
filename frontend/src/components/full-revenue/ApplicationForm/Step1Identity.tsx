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
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Datos del negocio
        </h2>
        <p className="text-sm text-gray-500">
          Información básica de tu empresa para iniciar la evaluación
        </p>
      </div>

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
        placeholder="Ej: 55 1234-5678 o +52 55 1234 5678"
        hint="Podés incluir espacios, guiones o el código de país. Usado para verificar tu identidad."
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Input
        label="Email de contacto"
        type="email"
        placeholder="nombre@empresa.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" fullWidth size="lg">
        Continuar
      </Button>
    </form>
  );
}
