import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest";
import { track, list, metrics } from "../controllers/events.controller";

const router = Router();

const eventSchema = z.object({
  event_name: z.string().min(1).max(100),
  merchant_id: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

// POST /events — registrar evento
router.post("/", validateBody(eventSchema), track);

// GET /events/metrics — agregados para dashboard
router.get("/metrics", metrics);

// GET /events — listado de eventos recientes (filtros via query)
router.get("/", list);

export default router;
