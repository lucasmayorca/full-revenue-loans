import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "@google-cloud/firestore";
import { ApplicationDoc, FormData } from "../models/Application";
import { runUnderwriting } from "./underwriting.service";
import { logger } from "../utils/logger";

// In-memory store — works without Firestore for local dev / DEMO_MODE
const memStore = new Map<string, ApplicationDoc>();

export async function createApplication(
  merchantId: string
): Promise<ApplicationDoc> {
  const id = uuidv4();
  const now = Timestamp.now();

  const doc: ApplicationDoc = {
    id,
    merchant_id: merchantId,
    created_at: now,
    updated_at: now,
    decision_status: "UNDERWRITING_PENDING",
  };

  memStore.set(id, doc);
  logger.info("application_created", { id, merchant_id: merchantId });
  return doc;
}

export async function getApplicationById(
  id: string
): Promise<ApplicationDoc | null> {
  return memStore.get(id) ?? null;
}

export async function submitApplication(
  id: string,
  formData: FormData
): Promise<ApplicationDoc> {
  const application = memStore.get(id);

  if (!application) {
    const err = new Error(`Application ${id} not found`) as Error & {
      statusCode: number;
      isOperational: boolean;
    };
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const decision = await runUnderwriting({
    ...application,
    form_data: formData,
  });

  const updated: ApplicationDoc = {
    ...application,
    form_data: formData,
    decision_status: decision.status,
    decision_payload: decision.payload,
    syntage_result: decision.syntage_result,
    places_result: decision.places_result,
    facebook_result: decision.facebook_result,
    instagram_result: decision.instagram_result,
    twilio_result: decision.twilio_result,
    bureau_result: decision.bureau_result,
    platform_result: decision.platform_result,
    updated_at: Timestamp.now(),
  };

  memStore.set(id, updated);
  logger.info("application_submitted", { id, status: decision.status });
  return updated;
}
