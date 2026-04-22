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

      {/* Teléfono — con instrucción explícita de formato para Twilio Lookup */}
      <Input
        label="Teléfono celular (con código de país)"
        type="tel"
        placeholder="+52 55 1234 5678"
        hint="Ingresá +52 seguido de tu número de 10 dígitos. Ej: +52 55 1234 5678. Se usará para verificar tu identidad."
        error={errors.phone?.message}
        {...register("phone")}
      />

      {/* CURP — requerido para consulta al Buró de Crédito */}
      <div className="space-y-1">
        <Input
          label="CURP del dueño o representante legal"
          placeholder="Ej: GOPO820116MDFRRR09"
          hint="18 caracteres. Requerido para consultar tu historial en el Buró de Crédito."
          error={errors.curp?.message}
          {...register("curp")}
        />
        <div className="flex items-center gap-1.5 px-0.5">
          <svg className="w-3.5 h-3.5 text-uber-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <a
            href="https://www.gob.mx/curp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-uber-gray-500 underline hover:text-black transition-colors"
          >
            ¿No sabés tu CURP? Consultalo en gob.mx/curp
          </a>
        </div>
      </div>

      <Button type="submit" fullWidth size="lg">
        Continuar
      </Button>
    </form>
  );
}
