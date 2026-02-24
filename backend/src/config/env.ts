import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3001),

    DEMO_MODE: z
      .string()
      .transform((v) => v === "true")
      .default("false"),

    APPROVAL_THRESHOLD: z.coerce.number().default(50000),

    SYNTAGE_BASE_URL: z.string().url().optional(),
    SYNTAGE_API_KEY: z.string().optional(),
    SYNTAGE_TIMEOUT_MS: z.coerce.number().default(10000),

    // Google Places API — solo necesario si DEMO_MODE=false
    // Habilitar en: https://console.cloud.google.com → APIs → Places API (Legacy)
    GOOGLE_PLACES_API_KEY: z.string().default(""),

    // Facebook / Instagram OAuth — solo necesario si DEMO_MODE=false
    // Crear en: https://developers.facebook.com/apps → tipo "Negocios"
    FACEBOOK_APP_ID: z.string().default(""),
    FACEBOOK_APP_SECRET: z.string().default(""),

    // Twilio — Lookup Identity Match + WhatsApp Business
    // Crear en: https://console.twilio.com → Account Info
    TWILIO_ACCOUNT_SID: z.string().default(""),
    TWILIO_AUTH_TOKEN: z.string().default(""),

    GCP_PROJECT_ID: z.string().default("demo-local"),
    FIRESTORE_EMULATOR_HOST: z.string().optional(),

    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    BACKEND_URL: z.string().url().default("http://localhost:3001"),
  })
  .superRefine((data, ctx) => {
    // En producción, las credenciales reales son obligatorias
    if (!data.DEMO_MODE) {
      if (!data.GOOGLE_PLACES_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GOOGLE_PLACES_API_KEY is required when DEMO_MODE=false",
          path: ["GOOGLE_PLACES_API_KEY"],
        });
      }
      if (!data.GCP_PROJECT_ID || data.GCP_PROJECT_ID === "demo-local") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GCP_PROJECT_ID is required when DEMO_MODE=false",
          path: ["GCP_PROJECT_ID"],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
