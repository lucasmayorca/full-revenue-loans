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

    // En DEMO_MODE estas variables no se usan — se vuelven opcionales.
    // En producción (DEMO_MODE=false) son requeridas y se validan en superRefine.
    GOOGLE_CLIENT_ID: z.string().default(""),
    GOOGLE_CLIENT_SECRET: z.string().default(""),
    GOOGLE_REDIRECT_URI: z
      .string()
      .default("http://localhost:3001/full-revenue/oauth/google/callback"),

    GCP_PROJECT_ID: z.string().default("demo-local"),
    FIRESTORE_EMULATOR_HOST: z.string().optional(),

    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  })
  .superRefine((data, ctx) => {
    // En producción, las credenciales reales son obligatorias
    if (!data.DEMO_MODE) {
      if (!data.GOOGLE_CLIENT_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GOOGLE_CLIENT_ID is required when DEMO_MODE=false",
          path: ["GOOGLE_CLIENT_ID"],
        });
      }
      if (!data.GOOGLE_CLIENT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GOOGLE_CLIENT_SECRET is required when DEMO_MODE=false",
          path: ["GOOGLE_CLIENT_SECRET"],
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
