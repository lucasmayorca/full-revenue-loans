"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fiscalSchema, FiscalValues } from "@/lib/validation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Landmark, Lock } from "lucide-react";

interface Props {
  onComplete: (data: FiscalValues) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function StepFiscal({ onComplete, onBack, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FiscalValues>({
    resolver: zodResolver(fiscalSchema),
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Datos fiscales
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Con tu Clave CIEC podemos consultar tu historial fiscal en el SAT
          y calcular tu oferta máxima.
        </p>
      </div>

      {/* Banner motivacional */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Landmark className="w-5 h-5 text-purple-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-800">Desbloquea tu oferta máxima</p>
          <p className="text-xs text-purple-600 mt-0.5">Tu crédito puede crecer hasta <strong>3X</strong> con datos del SAT</p>
        </div>
      </div>

      <Input
        label="Clave CIEC"
        type="password"
        placeholder="Tu contraseña del SAT"
        error={errors.ciec?.message}
        hint="Usamos tu CIEC para consultar tus datos fiscales en el SAT vía Syntage"
        {...register("ciec")}
      />

      {/* Consent SAT */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer border-2 rounded-2xl p-4 border-gray-200 bg-white hover:border-gray-300 transition-all">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange flex-shrink-0"
            {...register("sat_consent")}
          />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Landmark className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-900">Uso de datos fiscales y de plataforma</p>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Requerido</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Autorizo el procesamiento de mis datos fiscales del SAT (vía Syntage) y mis datos de ventas en Rappi para evaluar mi perfil crediticio.
            </p>
          </div>
        </label>
        {errors.sat_consent && (
          <p className="text-xs text-red-500 ml-7">{errors.sat_consent.message}</p>
        )}
      </div>

      {/* Nota de seguridad */}
      <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
        <span>Tu Clave CIEC se transmite de forma encriptada y solo se usa para
        consultar tu historial fiscal. No la almacenamos.</span>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading} fullWidth>
          Atrás
        </Button>
        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
