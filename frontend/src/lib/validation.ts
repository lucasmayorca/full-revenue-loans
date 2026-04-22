import { z } from "zod";

export const step1Schema = z.object({
  legal_name: z
    .string()
    .min(2, "El nombre legal debe tener al menos 2 caracteres")
    .max(200),
  address: z.string().min(5, "La dirección es demasiado corta").max(500),
  email: z.string().email("Email inválido"),

  // Teléfono en formato E.164 para México (+52 seguido de 10 dígitos)
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .transform((v) => {
      // Quitar espacios, guiones y paréntesis (conservar el +)
      let n = v.replace(/[\s\-()]/g, "");
      // "525512345678" → "+525512345678"
      if (/^52\d{10}$/.test(n)) return `+${n}`;
      // "5512345678" (10 dígitos locales) → "+525512345678"
      if (/^\d{10}$/.test(n)) return `+52${n}`;
      return n;
    })
    .refine(
      (v) => /^\+52\d{10}$/.test(v),
      "Formato inválido. Usá: +52 seguido de 10 dígitos (ej: +52 55 1234 5678)"
    ),

  // CURP del dueño o representante legal — necesario para consulta al Buró
  curp: z
    .string()
    .regex(
      /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/i,
      "CURP inválida. Debe tener 18 caracteres (ej: GOPO820116MDFRRR09)"
    )
    .refine((v) => v.length === 18, "El CURP debe tener exactamente 18 caracteres"),

  // Campos opcionales (usados en pasos posteriores)
  tax_id: z
    .string()
    .min(12, "El RFC debe tener 12 o 13 caracteres")
    .max(13, "El RFC debe tener 12 o 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido (ej: XAXX010101000)")
    .optional()
    .or(z.literal("")),
  ciec: z
    .string()
    .min(8, "La Clave CIEC debe tener al menos 8 caracteres")
    .max(20, "La Clave CIEC es demasiado larga")
    .optional()
    .or(z.literal("")),
});

// Schema for fiscal step (RFC + CIEC)
export const fiscalSchema = z.object({
  tax_id: z
    .string()
    .min(12, "El RFC debe tener 12 o 13 caracteres")
    .max(13, "El RFC debe tener 12 o 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido (ej: XAXX010101000)"),
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
