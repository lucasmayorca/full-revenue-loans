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
          Información fiscal de tu empresa para consultar tus ingresos
        </p>
      </div>

      <Input
        label="Razón social"
        placeholder="Ej: Restaurante El Buen Sabor S.A. de C.V."
        error={errors.legal_name?.message}
        {...register("legal_name")}
      />

      <Input
        label="RFC"
        placeholder="Ej: REST123456ABC"
        error={errors.tax_id?.message}
        hint="12 o 13 caracteres, tal como aparece en tu constancia fiscal"
        {...register("tax_id")}
      />

      <Input
        label="Clave CIEC"
        type="password"
        placeholder="Tu contraseña del SAT"
        error={errors.ciec?.message}
        hint="Usamos tu CIEC para consultar tus datos fiscales en el SAT vía Syntage"
        {...register("ciec")}
      />

      <Input
        label="Domicilio fiscal"
        placeholder="Calle, número, colonia, ciudad, C.P."
        error={errors.address?.message}
        {...register("address")}
      />

      <Input
        label="Email de contacto"
        type="email"
        placeholder="nombre@empresa.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
        🔒 Tu Clave CIEC se transmite de forma encriptada y solo se usa para
        consultar tu historial fiscal. No la almacenamos.
      </div>

      <Button type="submit" fullWidth size="lg">
        Continuar
      </Button>
    </form>
  );
}
