import cors from "cors";
import { env } from "../config/env";

// En producción acepta FRONTEND_URL + orígenes adicionales separados por coma
// Ejemplo: CORS_EXTRA_ORIGINS=https://otro.vercel.app,https://staging.example.com
const allowedOrigins: string[] = [env.FRONTEND_URL];

if (process.env.CORS_EXTRA_ORIGINS) {
  allowedOrigins.push(
    ...process.env.CORS_EXTRA_ORIGINS.split(",").map((o) => o.trim())
  );
}

export const corsMiddleware = cors({
  origin: env.NODE_ENV === "development" ? true : allowedOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});
