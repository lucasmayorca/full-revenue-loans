"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  first_name:     z.string().min(2, "Ingresá tu nombre"),
  last_name:      z.string().min(2, "Ingresá tu apellido"),
  birth_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato: AAAA-MM-DD"),
  cedula:         z.string().min(12, "El RFC tiene 12 o 13 caracteres").max(13, "El RFC tiene 12 o 13 caracteres").toUpperCase(),
  nationality:    z.string().min(2, "Ingresá tu nacionalidad"),
  marital_status: z.enum(["soltero", "casado", "divorciado", "viudo", "union_libre"], {
    errorMap: () => ({ message: "Seleccioná un estado civil" }),
  }),
});

export type Step1PersonalValues = z.infer<typeof schema>;

const MARITAL_OPTIONS = [
  { value: "soltero",      label: "Soltero/a" },
  { value: "casado",       label: "Casado/a" },
  { value: "divorciado",   label: "Divorciado/a" },
  { value: "viudo",        label: "Viudo/a" },
  { value: "union_libre",  label: "Unión libre" },
];

interface Props {
  defaultValues?: Partial<Step1PersonalValues>;
  onComplete: (data: Step1PersonalValues) => void;
}

export function Step1Personal({ defaultValues, onComplete }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1PersonalValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-4">
      {/* Nombre y apellido — pre-completado por Rappi vía API */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nombre(s)"
          placeholder="Guillermo"
          error={errors.first_name?.message}
          {...register("first_name")}
        />
        <Input
          label="Apellido(s)"
          placeholder="Bravo"
          error={errors.last_name?.message}
          {...register("last_name")}
        />
      </div>

      <Input
        label="Fecha de nacimiento"
        type="date"
        error={errors.birth_date?.message}
        {...register("birth_date")}
      />

      {/* RFC — el usuario lo completa, Rappi no lo comparte */}
      <Input
        label="RFC"
        placeholder="GALO800101AB2"
        hint="12 caracteres para personas físicas, 13 para morales"
        error={errors.cedula?.message}
        {...register("cedula")}
      />

      <Input
        label="Nacionalidad"
        placeholder="Mexicana"
        error={errors.nationality?.message}
        {...register("nationality")}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estado civil
        </label>
        <select
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:border-transparent"
          {...register("marital_status")}
        >
          <option value="">Seleccioná...</option>
          {MARITAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {errors.marital_status && (
          <p className="text-xs text-red-500 mt-1">{errors.marital_status.message}</p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" fullWidth>
          Continuar
        </Button>
      </div>
    </form>
  );
}
