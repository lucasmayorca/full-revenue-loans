"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  street:       z.string().min(3, "Ingresá la dirección"),
  neighborhood: z.string().optional().default(""),   // incluido en street
  postal_code:  z.string().regex(/^\d{5}$/, "El CP debe tener 5 dígitos"),
  city:         z.string().min(2, "Ingresá la ciudad"),
  state:        z.string().min(2, "Ingresá el estado"),
  country:      z.string().default("México"),
});

export type Step2AddressValues = z.infer<typeof schema>;

const MX_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México",
  "Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

interface Props {
  defaultValues?: Partial<Step2AddressValues>;
  onComplete: (data: Step2AddressValues) => void;
  onBack: () => void;
}

export function Step2Address({ defaultValues, onComplete, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2AddressValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "México", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-4">
      {/* Header de sección */}
      <div className="pb-1">
        <h2 className="text-base font-bold text-gray-900">Dirección del negocio</h2>
        <p className="text-xs text-gray-400 mt-0.5">Confirmá o editá la dirección fiscal de tu negocio</p>
      </div>

      {/* Dirección completa en una sola línea */}
      <Input
        label="Calle, número y colonia"
        placeholder="Av. Insurgentes Sur 123, Col. Del Valle"
        error={errors.street?.message}
        {...register("street")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Código postal"
          placeholder="06600"
          error={errors.postal_code?.message}
          {...register("postal_code")}
        />
        <Input
          label="Ciudad"
          placeholder="CDMX"
          error={errors.city?.message}
          {...register("city")}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:border-transparent"
          {...register("state")}
        >
          <option value="">Seleccioná...</option>
          {MX_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onBack}>
          Atrás
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          Continuar
        </Button>
      </div>
    </form>
  );
}
