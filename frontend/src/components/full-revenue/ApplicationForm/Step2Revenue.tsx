"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, Step2Values, REVENUE_SOURCES } from "@/lib/validation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  defaultValues: Partial<Step2Values>;
  onComplete: (data: Step2Values) => void;
  onBack: () => void;
}

export function Step2Revenue({ defaultValues, onComplete, onBack }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      revenue_sources: [],
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Ventas fuera de Rappi
        </h2>
        <p className="text-sm text-gray-500">
          Declaración de ventas de otras fuentes
        </p>
      </div>

      <Controller
        name="monthly_revenue_estimate"
        control={control}
        render={({ field }) => (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Ventas mensuales estimadas (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                min="0"
                className={[
                  "w-full pl-8 pr-4 py-3 rounded-xl border text-base transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:border-transparent",
                  errors.monthly_revenue_estimate
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white hover:border-gray-400",
                ].join(" ")}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            {errors.monthly_revenue_estimate && (
              <p className="text-xs text-red-600" role="alert">
                {errors.monthly_revenue_estimate.message}
              </p>
            )}
          </div>
        )}
      />

      <Controller
        name="revenue_sources"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fuentes de ventas
            </label>
            <div className="space-y-2">
              {REVENUE_SOURCES.map((source) => (
                <label
                  key={source.value}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-rappi-orange cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-rappi-orange rounded border-gray-300 focus:ring-rappi-orange"
                    checked={field.value?.includes(source.value) ?? false}
                    onChange={(e) => {
                      const current = field.value ?? [];
                      field.onChange(
                        e.target.checked
                          ? [...current, source.value]
                          : current.filter((v) => v !== source.value)
                      );
                    }}
                  />
                  <span className="text-sm text-gray-700">{source.label}</span>
                </label>
              ))}
            </div>
            {errors.revenue_sources && (
              <p className="text-xs text-red-600" role="alert">
                {errors.revenue_sources.message}
              </p>
            )}
          </div>
        )}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Notas adicionales{" "}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          placeholder="Contexto adicional sobre tus ventas..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base resize-none focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:border-transparent hover:border-gray-400"
          {...register("notes")}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} fullWidth>
          Atrás
        </Button>
        <Button type="submit" fullWidth size="lg">
          Continuar
        </Button>
      </div>
    </form>
  );
}
