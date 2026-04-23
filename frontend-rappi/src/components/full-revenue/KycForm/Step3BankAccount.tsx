"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  clabe:        z.string().regex(/^\d{18}$/, "La CLABE debe tener 18 dígitos"),
  bank_name:    z.string().min(2, "Ingresá el banco"),
  account_type: z.enum(["debito", "cheques"], {
    errorMap: () => ({ message: "Seleccioná un tipo de cuenta" }),
  }),
  account_holder: z.string().min(3, "Ingresá el nombre del titular"),
});

export type Step3BankValues = z.infer<typeof schema>;

const MX_BANKS = [
  "BBVA México","Citibanamex","Santander","HSBC","Banorte","Inbursa",
  "Scotiabank","Banco Azteca","BanBajío","Afirme","Multiva","Mifel",
  "Intercam Banco","CoDi / SPEI / Otro",
];

interface Props {
  defaultValues?: Partial<Step3BankValues>;
  onComplete: (data: Step3BankValues) => void;
  onBack: () => void;
}

export function Step3BankAccount({ defaultValues, onComplete, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3BankValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} noValidate className="space-y-4">
      {/* Header de sección */}
      <div className="pb-1">
        <h2 className="text-base font-bold text-gray-900">Cuenta bancaria</h2>
        <p className="text-xs text-gray-400 mt-0.5">Donde Rappi realizará el desembolso del crédito</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          Esta cuenta se usará para el débito directo del remanente mensual en caso de que las retenciones de Rappi no cubran la cuota completa.
        </p>
      </div>

      <Input
        label="CLABE interbancaria"
        placeholder="012345678901234567"
        error={errors.clabe?.message}
        {...register("clabe")}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
        <select
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rappi-orange focus:border-transparent"
          {...register("bank_name")}
        >
          <option value="">Seleccioná tu banco...</option>
          {MX_BANKS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.bank_name && <p className="text-xs text-red-500 mt-1">{errors.bank_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "debito", label: "💳 Débito" },
            { value: "cheques", label: "📄 Cheques" },
          ].map(({ value, label }) => (
            <label key={value} className="relative flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer has-[:checked]:border-rappi-orange has-[:checked]:bg-orange-50">
              <input type="radio" value={value} className="sr-only" {...register("account_type")} />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        {errors.account_type && <p className="text-xs text-red-500 mt-1">{errors.account_type.message}</p>}
      </div>

      <Input
        label="Titular de la cuenta"
        placeholder="Juan García López"
        error={errors.account_holder?.message}
        {...register("account_holder")}
      />

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
