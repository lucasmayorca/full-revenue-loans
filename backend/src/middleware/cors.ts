import cors from "cors";
import { env } from "../config/env";

export const corsMiddleware = cors({
  origin: env.NODE_ENV === "development" ? true : env.FRONTEND_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});
