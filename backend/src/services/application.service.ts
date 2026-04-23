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
import { isPgEnabled, query } from "../clients/pgClient";

// In-memory fallback — se usa cuando DATABASE_URL no está configurada
// (local dev / DEMO_MODE sin Postgres).
const memStore = new Map<string, ApplicationDoc>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function timestampFromDate(date: Date): Timestamp {
  return new Timestamp(Math.floor(date.getTime() / 1000), 0);
}

function rowToDoc(row: { id: string; merchant_id: string; decision_status: string; created_at: Date; updated_at: Date; data: Record<string, unknown> }): ApplicationDoc {
  const data = row.data as Partial<ApplicationDoc>;
  return {
    ...data,
    id: row.id,
    merchant_id: row.merchant_id,
    decision_status: row.decision_status as ApplicationDoc["decision_status"],
    created_at: timestampFromDate(row.created_at),
    updated_at: timestampFromDate(row.updated_at),
  };
}

function docToDataJson(doc: ApplicationDoc): Record<string, unknown> {
  // Extraemos los campos "columnados" para no duplicar
  const {
    id: _id,
    merchant_id: _mid,
    decision_status: _st,
    created_at: _c,
    updated_at: _u,
    ...rest
  } = doc;
  return rest as Record<string, unknown>;
}

// ── Persistencia ──────────────────────────────────────────────────────────────

async function upsertDoc(doc: ApplicationDoc): Promise<void> {
  if (!isPgEnabled()) {
    memStore.set(doc.id, doc);
    return;
  }

  const createdAt = new Date(doc.created_at.seconds * 1000);
  const updatedAt = new Date(doc.updated_at.seconds * 1000);
  const data = docToDataJson(doc);

  await query(
    `INSERT INTO applications (id, merchant_id, decision_status, created_at, updated_at, data)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       merchant_id = EXCLUDED.merchant_id,
       decision_status = EXCLUDED.decision_status,
       updated_at = EXCLUDED.updated_at,
       data = EXCLUDED.data`,
    [doc.id, doc.merchant_id, doc.decision_status, createdAt, updatedAt, JSON.stringify(data)]
  );
}

async function fetchDoc(id: string): Promise<ApplicationDoc | null> {
  if (!isPgEnabled()) {
    return memStore.get(id) ?? null;
  }

  const res = await query(
    `SELECT id, merchant_id, decision_status, created_at, updated_at, data
     FROM applications WHERE id = $1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0] as { id: string; merchant_id: string; decision_status: string; created_at: Date; updated_at: Date; data: Record<string, unknown> };
  return rowToDoc(row);
}

// ── API pública ───────────────────────────────────────────────────────────────

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

  await upsertDoc(doc);
  logger.info("application_created", { id, merchant_id: merchantId });
  return doc;
}

export async function getApplicationById(
  id: string
): Promise<ApplicationDoc | null> {
  return fetchDoc(id);
}

/**
 * Lista TODAS las aplicaciones para el dashboard admin.
 */
export async function listAllApplications(options?: {
  limit?: number;
  orderDesc?: boolean;
}): Promise<ApplicationDoc[]> {
  if (!isPgEnabled()) {
    const all = Array.from(memStore.values());
    all.sort((a, b) => {
      const aTs = a.updated_at?.seconds ?? 0;
      const bTs = b.updated_at?.seconds ?? 0;
      return options?.orderDesc === false ? aTs - bTs : bTs - aTs;
    });
    return options?.limit ? all.slice(0, options.limit) : all;
  }

  const direction = options?.orderDesc === false ? "ASC" : "DESC";
  const limitClause = options?.limit ? `LIMIT ${Math.floor(options.limit)}` : "";
  const res = await query(
    `SELECT id, merchant_id, decision_status, created_at, updated_at, data
     FROM applications
     ORDER BY updated_at ${direction}
     ${limitClause}`
  );
  return res.rows.map((row) => rowToDoc(row as { id: string; merchant_id: string; decision_status: string; created_at: Date; updated_at: Date; data: Record<string, unknown> }));
}

export async function submitApplication(
  id: string,
  formData: FormData
): Promise<ApplicationDoc> {
  const application = await fetchDoc(id);

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

  await upsertDoc(updated);
  logger.info("application_submitted", { id, status: decision.status });
  return updated;
}

export async function updateConsent(
  id: string,
  consent: Omit<ConsentData, "consented_at">
): Promise<ApplicationDoc> {
  const application = await fetchDoc(id);
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

  await upsertDoc(updated);
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
  const application = await fetchDoc(id);
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

  await upsertDoc(updated);
  logger.info("kyc_submitted", { id });
  return updated;
}

/**
 * Actualiza la URL de Google Maps en una aplicación existente y re-corre
 * solo el lookup de Google Places, actualizando places_result.
 */
export async function patchGoogleUrl(
  id: string,
  googleBusinessUrl: string
): Promise<ApplicationDoc> {
  const { googlePlacesClient } = await import("../clients/googleClient");

  const application = await fetchDoc(id);
  if (!application) {
    const err = new Error(`Application ${id} not found`) as Error & {
      statusCode: number;
      isOperational: boolean;
    };
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const placesResult = await googlePlacesClient.getPlacesData(googleBusinessUrl);

  const updated: ApplicationDoc = {
    ...application,
    form_data: {
      ...application.form_data,
      google_business_url: googleBusinessUrl,
    } as ApplicationDoc["form_data"],
    places_result: placesResult,
    updated_at: Timestamp.now(),
  };

  await upsertDoc(updated);
  logger.info("google_url_patched", {
    id,
    connected: placesResult.connected,
    signals_score: placesResult.signals_score,
    business_name: placesResult.business_name,
  });
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
