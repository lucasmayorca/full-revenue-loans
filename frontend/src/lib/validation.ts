import { z } from "zod";

export const step1Schema = z.object({
  legal_name: z.string().optional().or(z.literal("")),
  address: z.string().min(5, "La dirección es demasiado corta").max(500),
  email: z.string().email("Email inválido"),

  // Teléfono en formato E.164 — acepta cualquier país
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .transform((v) => {
      // Quitar espacios, guiones y paréntesis (conservar el +)
      let n = v.replace(/[\s\-()]/g, "");
      // "5512345678" (10 dígitos locales) → "+525512345678"
      if (/^\d{10}$/.test(n)) return `+52${n}`;
      // "525512345678" → "+525512345678"
      if (/^52\d{10}$/.test(n)) return `+${n}`;
      return n;
    })
    .refine(
      (v) => /^\+\d{7,15}$/.test(v),
      "Incluí el código de país con + (ej: +52 55 1234 5678, +1 800 555 0100, +34 612 345 678)"
    ),

  // RFC del dueño o representante legal — requerido para Buró de Crédito y SAT
  tax_id: z
    .string()
    .min(12, "El RFC debe tener 12 o 13 caracteres")
    .max(13, "El RFC debe tener 12 o 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido (ej: XAXX010101000)"),
});

// Schema for fiscal step — solo CIEC (RFC ya se capturó en Step 1)
export const fiscalSchema = z.object({
  ciec: z
    .string()
    .min(8, "La Clave CIEC debe tener al menos 8 caracteres")
    .max(20, "La Clave CIEC es demasiado larga"),
  sat_consent: z.literal(true, {
    errorMap: () => ({ message: "Debés autorizar la consulta de datos fiscales" }),
  }),
});

export type FiscalValues = z.infer<typeof fiscalSchema>;

export type Step1Values = z.infer<typeof step1Schema>;
