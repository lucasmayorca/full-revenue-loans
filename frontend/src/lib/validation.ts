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
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, "Formato de RFC inválido (ej: XAXX010101000)")
    .optional()
    .or(z.literal("")),
  ciec: z
    .string()
    .min(8, "La Clave CIEC debe tener al menos 8 caracteres")
    .max(20, "La Clave CIEC es demasiado larga")
    .optional()
    .or(z.literal("")),
  address: z.string().min(5, "La dirección es demasiado corta").max(500),
  phone: z
    .string()
    .min(7, "El teléfono es demasiado corto")
    .max(25, "El teléfono es demasiado largo")
    .transform((v) => v.replace(/[\s\-().+]/g, ""))
    .refine((v) => /^[0-9]{7,15}$/.test(v), "Ingresá solo números (podés usar guiones o espacios)"),
  email: z.string().email("Email inválido"),
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
