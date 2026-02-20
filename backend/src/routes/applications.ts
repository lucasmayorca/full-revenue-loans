import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest";
import * as ctrl from "../controllers/applications.controller";

const router = Router();

const createSchema = z.object({
  merchant_id: z.string().min(1),
});

const formDataSchema = z.object({
  legal_name: z.string().min(2).max(200),
  tax_id: z.string().min(12).max(13),
  ciec: z.string().min(8).max(20),
  address: z.string().min(5).max(500),
  email: z.string().email(),
  monthly_revenue_estimate: z.number().positive(),
  revenue_sources: z.array(z.string()).min(1),
  notes: z.string().max(1000).optional(),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" }),
  }),
  google_business_url: z.string().url().optional().or(z.literal("")),
});

const submitSchema = z.object({
  form_data: formDataSchema,
});

// POST /full-revenue/applications
router.post("/", validateBody(createSchema), ctrl.create);

// GET /full-revenue/applications/:id
router.get("/:id([0-9a-f-]{36})", ctrl.getById);

// POST /full-revenue/applications/:id/submit
router.post("/:id([0-9a-f-]{36})/submit", validateBody(submitSchema), ctrl.submit);

export default router;
