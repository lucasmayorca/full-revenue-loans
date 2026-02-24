import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { validateBody } from "../middleware/validateRequest";
import * as ctrl from "../controllers/applications.controller";
import { facebookClient } from "../clients/facebookClient";
import { env } from "../config/env";

// ── Multer config for KYC document uploads ──
const uploadsDir = path.join(process.cwd(), "uploads", "kyc");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Use JPG, PNG, or PDF.`));
    }
  },
});

const router = Router();

const createSchema = z.object({
  merchant_id: z.string().min(1),
});

const formDataSchema = z.object({
  legal_name: z.string().min(2).max(200),
  tax_id: z.string().min(12).max(13).optional().or(z.literal("")),
  ciec: z.string().min(8).max(20).optional().or(z.literal("")),
  address: z.string().min(5).max(500),
  email: z.string().email(),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" }),
  }),
  phone: z.string().optional(),
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

    // En demo mode, simular conexión exitosa sin ir a Facebook
    if (env.DEMO_MODE) {
      res.redirect(
        `${env.FRONTEND_URL}/full-revenue/apply?facebook=connected&fb_token=demo_token_${Date.now()}&appId=${applicationId}`
      );
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

      // En demo mode no hace falta intercambiar el code
      if (env.DEMO_MODE) {
        res.redirect(
          `${env.FRONTEND_URL}/full-revenue/apply?facebook=connected&fb_token=demo_token_${Date.now()}&appId=${applicationId}`
        );
        return;
      }

      const accessToken = await facebookClient.exchangeCode(code);
      res.redirect(
        `${env.FRONTEND_URL}/full-revenue/apply?facebook=connected&fb_token=${accessToken}&appId=${applicationId}`
      );
    } catch (err) {
      next(err);
    }
  }
);

// ── Consent schema ──
const consentSchema = z.object({
  bureau_consent: z.literal(true),
  twilio_consent: z.literal(true),
  data_processing_consent: z.literal(true),
});

// POST /full-revenue/applications/:id/consent
router.post(
  "/:id([0-9a-f-]{36})/consent",
  validateBody(consentSchema),
  ctrl.updateConsent
);

// POST /full-revenue/applications/:id/kyc  (multipart/form-data)
router.post(
  "/:id([0-9a-f-]{36})/kyc",
  upload.fields([
    { name: "id_front", maxCount: 1 },
    { name: "id_back", maxCount: 1 },
    { name: "proof_of_address", maxCount: 1 },
  ]),
  ctrl.submitKyc
);

// GET /full-revenue/applications/:id/prequal
router.get("/:id([0-9a-f-]{36})/prequal", ctrl.prequalify);

export default router;
