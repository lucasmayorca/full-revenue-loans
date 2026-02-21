import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./middleware/cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import applicationsRouter from "./routes/applications";
import eventsRouter from "./routes/events";

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", demo_mode: process.env.DEMO_MODE === "true" });
  });

  app.use("/full-revenue/applications", applicationsRouter);
  app.use("/full-revenue", applicationsRouter);
  app.use("/events", eventsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
