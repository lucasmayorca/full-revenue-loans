import { z } from "zod";

export const step1Schema = z.object({
  legal_name: z
    .string()
    .min(2, "El nombre legal debe tener al menos 2 caracteres")
    .max(200),
  tax_id: z
    .string()
    .min(12, "El RFC debe tener 12 o 13 caracteres")
    .max(13, "El RFC debe tener 12 o 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido (ej: XAXX010101000)"),
  ciec: z
    .string()
    .min(8, "La Clave CIEC debe tener al menos 8 caracteres")
    .max(20, "La Clave CIEC es demasiado larga"),
  address: z.string().min(5, "La dirección es demasiado corta").max(500),
  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15)
    .regex(/^\+?[0-9]{10,15}$/, "Formato inválido (ej: 5512345678)"),
  email: z.string().email("Email inválido"),
});

export const REVENUE_SOURCES = [
  { value: "ventas_rappi", label: "Ventas en Rappi" },
  { value: "ventas_delivery", label: "Ventas en otras aplicaciones de delivery" },
  { value: "ventas_fisicas", label: "Ventas en tiendas físicas" },
  { value: "otras_ventas", label: "Otras ventas" },
] as const;

const revenueSourceValues = REVENUE_SOURCES.map((s) => s.value) as [
  string,
  ...string[]
];

export const step2Schema = z.object({
  monthly_revenue_estimate: z
    .number({ invalid_type_error: "Ingresá un número válido" })
    .positive("El monto debe ser mayor a 0"),
  revenue_sources: z
    .array(z.enum(revenueSourceValues))
    .min(1, "Seleccioná al menos una fuente de ventas"),
  notes: z.string().max(1000).optional(),
});

export const step3Schema = z.object({
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "Debés aceptar los términos para continuar" }),
  }),
  google_business_url: z.string().url("Ingresá una URL válida").optional().or(z.literal("")),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
