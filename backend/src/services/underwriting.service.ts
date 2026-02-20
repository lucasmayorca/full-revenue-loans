import { syntageClient } from "../clients/syntageClient";
import { googleClient } from "../clients/googleClient";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { withTimeout } from "../utils/timeout";
import {
  ApplicationDoc,
  DecisionPayload,
  DecisionStatus,
  SyntageResult,
  GoogleResult,
} from "../models/Application";

export interface UnderwritingDecision {
  status: DecisionStatus;
  payload: DecisionPayload;
  syntage_result?: SyntageResult;
  google_result?: GoogleResult;
}

export async function runUnderwriting(
  application: ApplicationDoc
): Promise<UnderwritingDecision> {
  const logCtx = {
    application_id: application.id,
    merchant_id: application.merchant_id,
  };
  logger.info("underwriting_started", logCtx);

  // --- 1. Fetch Syntage (SAT / datos fiscales) ---
  let syntageResult: SyntageResult | undefined;
  let syntageMonthlyRevenue = 0;
  let syntageAvailable = false;

  try {
    const raw = await withTimeout(
      syntageClient.getRevenueData(application.merchant_id),
      env.SYNTAGE_TIMEOUT_MS,
      "Syntage fetch timed out"
    );

    const monthlyRevenue = raw.annual_revenue / 12;

    syntageResult = {
      merchant_id: raw.merchant_id,
      annual_revenue: raw.annual_revenue,
      monthly_revenue: monthlyRevenue,
      months_active: raw.months_active,
      // En producción Syntage devuelve régimen fiscal y conteo de CFDIs
      tax_regime: (raw as Record<string, unknown>).tax_regime as string | undefined,
      cfdi_count_last_12m: (raw as Record<string, unknown>).cfdi_count_last_12m as number | undefined,
      raw_response: raw as unknown as Record<string, unknown>,
      fetched_at: new Date().toISOString(),
    };

    syntageMonthlyRevenue = monthlyRevenue;
    syntageAvailable = true;

    logger.info("syntage_data_fetched", {
      ...logCtx,
      annual_revenue: raw.annual_revenue,
      monthly_revenue: monthlyRevenue,
      months_active: raw.months_active,
    });
  } catch (err) {
    logger.warn("syntage_fetch_failed", { ...logCtx, error: String(err) });
  }

  // --- 2. Fetch Google Business data (si está conectado) ---
  let googleResult: GoogleResult | undefined;
  let googleSignalsScore = 0;
  let googleAvailable = false;

  if (application.google_access_token) {
    try {
      const businessData = await withTimeout(
        googleClient.getBusinessData(application.google_access_token),
        12000,
        "Google fetch timed out"
      );

      const signalsScore = googleClient.computeSignalsScore(businessData);

      googleResult = {
        connected: true,
        business_data: businessData,
        signals_score: signalsScore,
        raw_response: businessData as unknown as Record<string, unknown>,
        fetched_at: new Date().toISOString(),
      };

      googleSignalsScore = signalsScore;
      googleAvailable = true;

      logger.info("google_data_fetched", {
        ...logCtx,
        signals_score: signalsScore,
        rating: businessData.rating,
        review_count: businessData.review_count,
        profile_views: businessData.profile_views,
        ga4_estimated_revenue: businessData.ga4_estimated_revenue,
        data_points: businessData.data_points,
      });
    } catch (err) {
      logger.warn("google_fetch_failed", { ...logCtx, error: String(err) });
      googleResult = { connected: true, fetched_at: new Date().toISOString() };
    }
  } else {
    googleResult = { connected: false, fetched_at: new Date().toISOString() };
  }

  // --- 3. Consolidar datos y armar payload completo ---
  // Siempre queda en MANUAL_REVIEW — un analista humano revisa y asigna el monto final.
  // El underwriting automatizado es solo para scoring y enriquecimiento de datos.
  const dataSources = [
    ...(syntageAvailable ? ["syntage"] : []),
    ...(googleAvailable ? ["google"] : []),
  ];

  const status: DecisionStatus = "MANUAL_REVIEW";
  const reason = buildReason(syntageAvailable, googleAvailable, syntageMonthlyRevenue, googleSignalsScore);

  const payload: DecisionPayload = {
    reason,
    syntage_monthly_revenue: syntageMonthlyRevenue,
    google_signals_score: googleSignalsScore,
    // total_revenue = ventas SAT + boost por señales Google (si score alto)
    // En producción el analista puede ajustar esto manualmente
    total_revenue: computeTotalRevenue(syntageMonthlyRevenue, googleSignalsScore),
    threshold_used: env.APPROVAL_THRESHOLD,
    data_sources: dataSources,
    decided_at: new Date().toISOString(),
  };

  logger.info("underwriting_completed", {
    ...logCtx,
    status,
    syntage_monthly_revenue: syntageMonthlyRevenue,
    google_signals_score: googleSignalsScore,
    total_revenue: payload.total_revenue,
    data_sources: dataSources,
  });

  return {
    status,
    payload,
    syntage_result: syntageResult,
    google_result: googleResult,
  };
}

/**
 * Calcula el ingreso total estimado ponderando ventas SAT + señales Google.
 * El score de Google funciona como multiplicador de confianza (no como ingreso directo).
 * Un score de 100 agrega hasta un 30% de boost al ingreso SAT.
 */
function computeTotalRevenue(syntageMonthly: number, googleScore: number): number {
  if (syntageMonthly === 0) return 0;
  const googleBoost = (googleScore / 100) * 0.3; // 0% a 30% de boost
  return Math.round(syntageMonthly * (1 + googleBoost));
}

/**
 * Genera un mensaje de razón descriptivo para el analista humano.
 */
function buildReason(
  syntageAvailable: boolean,
  googleAvailable: boolean,
  syntageRevenue: number,
  googleScore: number
): string {
  const parts: string[] = ["Solicitud en revisión manual para determinar nuevo monto Préstamo MÁS."];

  if (syntageAvailable) {
    parts.push(`Ventas SAT (Syntage): $${syntageRevenue.toLocaleString("es-MX")} MXN/mes.`);
  } else {
    parts.push("Datos SAT no disponibles — requiere revisión.");
  }

  if (googleAvailable) {
    parts.push(`Score señales Google: ${googleScore}/100 (reseñas, tráfico, tendencias).`);
  } else {
    parts.push("Google no conectado.");
  }

  return parts.join(" ");
}
