import { Request, Response, NextFunction } from "express";
import {
  createApplication,
  getApplicationById,
  submitApplication,
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
    // Remove sensitive token fields from response
    google_access_token: undefined,
    google_refresh_token: undefined,
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
    const { form_data } = req.body as { form_data: Record<string, unknown> };
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
