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
        label="Domicilio fiscal"
        placeholder="Calle, número, colonia, ciudad, C.P."
        error={errors.address?.message}
        {...register("address")}
      />

      {/* Teléfono — con instrucción explícita de formato para Twilio Lookup */}
      <Input
        label="Teléfono celular (con código de país)"
        type="tel"
        placeholder="+52 55 1234 5678"
        hint="Incluye el código de país. Ej: +52 (México), +1 (EE.UU.), +34 (España). Se usará para verificar tu identidad."
        error={errors.phone?.message}
        {...register("phone")}
      />

      {/* RFC — requerido para Buró de Crédito y consulta fiscal */}
      <Input
        label="RFC del dueño o representante legal"
        placeholder="Ej: XAXX010101000"
        hint="12 o 13 caracteres, tal como aparece en tu constancia fiscal del SAT."
        error={errors.tax_id?.message}
        {...register("tax_id")}
      />

      <Button type="submit" fullWidth size="lg">
        Continuar
      </Button>
    </form>
  );
}
