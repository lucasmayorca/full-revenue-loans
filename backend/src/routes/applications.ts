import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest";
import * as ctrl from "../controllers/applications.controller";
import { facebookClient } from "../clients/facebookClient";
import { env } from "../config/env";

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
  facebook_access_token: z.string().optional(),
  instagram_access_token: z.string().optional(),
  google_oauth_access_token: z.string().optional(),
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

// GET /full-revenue/oauth/facebook/redirect?applicationId=xxx
router.get(
  "/oauth/facebook/redirect",
  (req: Request, res: Response): void => {
    const { applicationId } = req.query;
    if (!applicationId || typeof applicationId !== "string") {
      res.status(400).json({ error: "applicationId query param required" });
      return;
    }
    if (!env.FACEBOOK_APP_ID) {
      res.status(503).json({ error: "Facebook OAuth not configured" });
      return;
    }
    const url = facebookClient.buildAuthUrl(applicationId);
    res.redirect(url);
  }
);

// GET /full-revenue/oauth/facebook/callback?code=xxx&state=applicationId
router.get(
  "/oauth/facebook/callback",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state: applicationId } = req.query;
      if (!code || !applicationId || typeof code !== "string" || typeof applicationId !== "string") {
        res.status(400).json({ error: "Missing code or state param" });
        return;
      }
      const accessToken = await facebookClient.exchangeCode(code);
      // Redirigir al frontend con el token (se guardará en el form state)
      res.redirect(
        `${env.FRONTEND_URL}/full-revenue/apply?facebook=connected&fb_token=${accessToken}&appId=${applicationId}`
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
