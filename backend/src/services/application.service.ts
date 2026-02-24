import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "@google-cloud/firestore";
import {
  ApplicationDoc,
  FormData,
  ConsentData,
  KycData,
  KycPersonalData,
  KycAddressData,
  KycBankData,
  KycDocuments,
} from "../models/Application";
import { runUnderwriting, runPrequalification } from "./underwriting.service";
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

export async function updateConsent(
  id: string,
  consent: Omit<ConsentData, "consented_at">
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

  const updated: ApplicationDoc = {
    ...application,
    consent_data: {
      ...consent,
      consented_at: new Date().toISOString(),
    },
    updated_at: Timestamp.now(),
  };

  memStore.set(id, updated);
  logger.info("consent_updated", { id });
  return updated;
}

export async function submitKyc(
  id: string,
  personal: KycPersonalData,
  address: KycAddressData,
  bank: KycBankData,
  documents: KycDocuments
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

  if (application.decision_status !== "APPROVED" && application.decision_status !== "MANUAL_REVIEW") {
    const err = new Error("KYC can only be submitted for approved applications") as Error & {
      statusCode: number;
      isOperational: boolean;
    };
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const kycData: KycData = {
    personal,
    address,
    bank,
    documents,
    submitted_at: new Date().toISOString(),
  };

  const updated: ApplicationDoc = {
    ...application,
    kyc_status: "SUBMITTED",
    kyc_data: kycData,
    updated_at: Timestamp.now(),
  };

  memStore.set(id, updated);
  logger.info("kyc_submitted", { id });
  return updated;
}

export interface PrequalResult {
  bureau_offer: number;
  social_offer: number;
  base_amount: number;
}

export async function prequalify(
  id: string,
  merchantId: string
): Promise<PrequalResult> {
  return runPrequalification(merchantId);
}
