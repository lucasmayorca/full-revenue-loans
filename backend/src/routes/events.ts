import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest";
import { track } from "../controllers/events.controller";

const router = Router();

const eventSchema = z.object({
  event_name: z.string().min(1).max(100),
  merchant_id: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

// POST /events
router.post("/", validateBody(eventSchema), track);

export default router;
