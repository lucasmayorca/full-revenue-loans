import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createApplication,
  getApplicationById,
  submitApplication,
  updateConsent as updateConsentService,
  submitKyc as submitKycService,
  prequalify as prequalifyService,
} from "../services/application.service";
import { ApplicationDoc } from "../models/Application";
import { Timestamp } from "@google-cloud/firestore";

function serializeApp(app: ApplicationDoc) {
  return {
    ...app,
    created_at:
      app.created_at instanceof Timestamp
        ? app.created_at.toDate().toISOString()
        : app.created_at,
    updated_at:
      app.updated_at instanceof Timestamp
        ? app.updated_at.toDate().toISOString()
        : app.updated_at,
  };
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { merchant_id } = req.body as { merchant_id: string };
    const app = await createApplication(merchant_id);
    res.status(201).json(serializeApp(app));
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const app = await getApplicationById(id);
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(serializeApp(app));
  } catch (err) {
    next(err);
  }
}

export async function submit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { form_data } = req.body as { form_data: unknown };
    const app = await submitApplication(id, form_data as Parameters<typeof submitApplication>[1]);
    res.json({
      id: app.id,
      status: app.decision_status,
      message: "Application submitted and underwriting completed",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateConsent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { bureau_consent, twilio_consent, data_processing_consent } = req.body;
    await updateConsentService(id, {
      bureau_consent,
      twilio_consent,
      data_processing_consent,
    });
    res.json({ message: "Consent recorded" });
  } catch (err) {
    next(err);
  }
}

// KYC validation schema
const kycPersonalSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  birth_date: z.string().min(8),
  cedula: z.string().min(12).max(13),  // RFC: 12 personas físicas, 13 morales
  nationality: z.string().min(2),
  marital_status: z.string().min(2),
});

const kycAddressSchema = z.object({
  street: z.string().min(3),
  neighborhood: z.string().optional().default(""),
  postal_code: z.string().length(5),
  city: z.string().min(2),
  state: z.string().min(2),
});

const kycBankSchema = z.object({
  clabe: z.string().length(18),
  bank_name: z.string().min(2),
  account_type: z.string().min(2),
  account_holder: z.string().min(2),
});

export async function submitKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Parse JSON fields from multipart form
    const personal = kycPersonalSchema.parse(JSON.parse(req.body.personal));
    const address = kycAddressSchema.parse(JSON.parse(req.body.address));
    const bank = kycBankSchema.parse(JSON.parse(req.body.bank));

    // Get uploaded file paths
    const files = req.files as Record<string, Express.Multer.File[]>;
    if (!files?.id_front?.[0] || !files?.id_back?.[0]) {
      res.status(400).json({ error: "Missing required documents: id_front, id_back" });
      return;
    }

    const documents = {
      id_front_path: files.id_front[0].path,
      id_back_path: files.id_back[0].path,
      proof_of_address_path: files.proof_of_address?.[0]?.path ?? null,
    };

    const app = await submitKycService(id, personal, address, bank, documents);
    res.json({
      id: app.id,
      kyc_status: app.kyc_status,
      message: "KYC submitted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function prequalify(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const app = await getApplicationById(id);
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    const result = await prequalifyService(id, app.merchant_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
