import { syntageClient } from "../clients/syntageClient";
import { googlePlacesClient } from "../clients/googleClient";
import { bureauClient } from "../clients/bureauClient";
import { platformClient } from "../clients/platformClient";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { withTimeout } from "../utils/timeout";
import {
  ApplicationDoc,
  DecisionPayload,
  DecisionStatus,
  SyntageResult,
  PlacesResult,
  BureauResult,
  PlatformResult,
} from "../models/Application";

export interface UnderwritingDecision {
  status: DecisionStatus;
  payload: DecisionPayload;
  syntage_result?: SyntageResult;
  places_result?: PlacesResult;
  bureau_result?: BureauResult;
  platform_result?: PlatformResult;
}

export async function runUnderwriting(
  application: ApplicationDoc
): Promise<UnderwritingDecision> {
  const logCtx = {
    application_id: application.id,
    merchant_id: application.merchant_id,
  };
  logger.info("underwriting_started", logCtx);

  const taxId = application.form_data?.tax_id ?? "";
  const mapsUrl = application.form_data?.google_business_url ?? "";

  // ── 1. Syntage / SAT ────────────────────────────────────────────────────────
  let syntageResult: SyntageResult | undefined;
  let syntageMonthlyRevenue = 0;
  let syntageAvailable = false;
  let syntageCompliance = true;

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
      tax_regime: raw.tax_regime,
      cfdi_count_last_12m: raw.cfdi_count_last_12m,
      tax_compliance: raw.tax_compliance ?? true,
      raw_response: raw as unknown as Record<string, unknown>,
      fetched_at: new Date().toISOString(),
    };

    syntageMonthlyRevenue = monthlyRevenue;
    syntageCompliance = raw.tax_compliance ?? true;
    syntageAvailable = true;

    logger.info("syntage_data_fetched", {
      ...logCtx,
      annual_revenue: raw.annual_revenue,
      monthly_revenue: monthlyRevenue,
      months_active: raw.months_active,
      tax_regime: raw.tax_regime,
      cfdi_count: raw.cfdi_count_last_12m,
      tax_compliance: raw.tax_compliance,
    });
  } catch (err) {
    logger.warn("syntage_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 2. Google Places (si el comercio pegó su URL de Maps) ───────────────────
  let placesResult: PlacesResult | undefined;
  let placesScore = 0;
  let placesAvailable = false;

  if (mapsUrl) {
    try {
      const places = await withTimeout(
        googlePlacesClient.getPlacesData(mapsUrl),
        10000,
        "Google Places fetch timed out"
      );

      placesResult = places;

      if (places.connected) {
        placesScore = places.signals_score ?? 0;
        placesAvailable = true;

        logger.info("google_places_data_fetched", {
          ...logCtx,
          business_name: places.business_name,
          rating: places.rating,
          review_count: places.total_review_count,
          signals_score: placesScore,
        });
      }
    } catch (err) {
      logger.warn("google_places_fetch_failed", { ...logCtx, error: String(err) });
      placesResult = { connected: false, fetched_at: new Date().toISOString() };
    }
  } else {
    placesResult = { connected: false, fetched_at: new Date().toISOString() };
    logger.info("google_places_skipped_no_url", logCtx);
  }

  // ── 3. Bureau de Crédito ────────────────────────────────────────────────────
  let bureauResult: BureauResult | undefined;
  let bureauScore: number | undefined;
  let bureauAvailable = false;

  try {
    const bureau = await withTimeout(
      bureauClient.getScore(taxId),
      8000,
      "Bureau fetch timed out"
    );

    bureauResult = bureau;

    if (bureau.bureau_score !== undefined) {
      bureauScore = bureau.bureau_score;
      bureauAvailable = true;

      logger.info("bureau_data_fetched", {
        ...logCtx,
        bureau_score: bureauScore,
        active_debt: bureau.active_debt_amount,
      });
    }
  } catch (err) {
    logger.warn("bureau_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 4. Platform (Rappi interno) ─────────────────────────────────────────────
  let platformResult: PlatformResult | undefined;
  let platformGmv: number | undefined;
  let tenureMonths: number | undefined;
  let platformAvailable = false;

  try {
    const platform = await withTimeout(
      platformClient.getMerchantData(application.merchant_id),
      5000,
      "Platform fetch timed out"
    );

    platformResult = platform;

    if (platform.avg_platform_gmv_6m !== undefined) {
      platformGmv = platform.avg_platform_gmv_6m;
      tenureMonths = platform.tenure_months;
      platformAvailable = true;

      logger.info("platform_data_fetched", {
        ...logCtx,
        gmv_6m: platformGmv,
        tenure_months: tenureMonths,
      });
    }
  } catch (err) {
    logger.warn("platform_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 5. Consolidar y calcular total ponderado ────────────────────────────────
  const dataSources = [
    ...(syntageAvailable ? ["syntage"] : []),
    ...(placesAvailable ? ["google_places"] : []),
    ...(bureauAvailable ? ["bureau"] : []),
    ...(platformAvailable ? ["platform"] : []),
  ];

  const totalRevenue = computeTotalRevenue(
    syntageMonthlyRevenue,
    placesScore,
    bureauScore,
    tenureMonths,
    syntageCompliance
  );

  const status: DecisionStatus = "MANUAL_REVIEW";

  const payload: DecisionPayload = {
    reason: buildReason({
      syntageAvailable,
      placesAvailable,
      bureauAvailable,
      platformAvailable,
      syntageMonthlyRevenue,
      placesScore,
      bureauScore,
      platformGmv,
      syntageCompliance,
    }),
    syntage_monthly_revenue: syntageMonthlyRevenue,
    syntage_tax_compliance: syntageCompliance,
    syntage_cfdi_count: syntageResult?.cfdi_count_last_12m,
    syntage_tax_regime: syntageResult?.tax_regime,
    places_signals_score: placesScore,
    places_rating: placesResult?.rating,
    places_review_count: placesResult?.total_review_count,
    bureau_score: bureauScore,
    platform_gmv_6m: platformGmv,
    platform_tenure_months: tenureMonths,
    total_revenue: totalRevenue,
    threshold_used: env.APPROVAL_THRESHOLD,
    data_sources: dataSources,
    decided_at: new Date().toISOString(),
  };

  logger.info("underwriting_completed", {
    ...logCtx,
    status,
    syntage_monthly_revenue: syntageMonthlyRevenue,
    places_signals_score: placesScore,
    bureau_score: bureauScore,
    platform_gmv_6m: platformGmv,
    total_revenue: totalRevenue,
    data_sources: dataSources,
  });

  return {
    status,
    payload,
    syntage_result: syntageResult,
    places_result: placesResult,
    bureau_result: bureauResult,
    platform_result: platformResult,
  };
}

/**
 * Ingreso total ponderado para el analista.
 *
 * total = syntage_monthly
 *       × (1 + places_score/100 × 0.20)   ← boost máx 20% por Google Places
 *       × bureau_multiplier                 ← 1.10 / 1.0 / 0.90
 *       × tenure_multiplier                 ← 1.05 / 1.0 / 0.95
 *       × (tax_compliance ? 1.0 : 0.80)    ← penalidad si tiene deuda SAT
 */
function computeTotalRevenue(
  syntageMonthly: number,
  placesScore: number,
  bureauScore: number | undefined,
  tenureMonths: number | undefined,
  taxCompliance: boolean
): number {
  if (syntageMonthly === 0) return 0;

  const placesBoost = 1 + (placesScore / 100) * 0.20;

  const bureauMultiplier =
    bureauScore === undefined ? 1.0
    : bureauScore > 700       ? 1.10
    : bureauScore > 600       ? 1.0
    :                           0.90;

  const tenureMultiplier =
    tenureMonths === undefined ? 1.0
    : tenureMonths > 24        ? 1.05
    : tenureMonths < 6         ? 0.95
    :                            1.0;

  const complianceMultiplier = taxCompliance ? 1.0 : 0.80;

  return Math.round(
    syntageMonthly * placesBoost * bureauMultiplier * tenureMultiplier * complianceMultiplier
  );
}

/**
 * Mensaje descriptivo para el analista humano.
 */
function buildReason(params: {
  syntageAvailable: boolean;
  placesAvailable: boolean;
  bureauAvailable: boolean;
  platformAvailable: boolean;
  syntageMonthlyRevenue: number;
  placesScore: number;
  bureauScore: number | undefined;
  platformGmv: number | undefined;
  syntageCompliance: boolean;
}): string {
  const parts: string[] = [
    "Solicitud en revisión manual para determinar nuevo monto Préstamo MÁS.",
  ];

  if (params.syntageAvailable) {
    parts.push(
      `Ventas SAT: $${params.syntageMonthlyRevenue.toLocaleString("es-MX")} MXN/mes.` +
        (!params.syntageCompliance ? " ⚠️ Deuda activa con SAT detectada." : "")
    );
  } else {
    parts.push("Datos SAT no disponibles — requiere verificación manual.");
  }

  if (params.placesAvailable) {
    parts.push(`Score Google Places: ${params.placesScore}/100.`);
  }

  if (params.bureauAvailable && params.bureauScore !== undefined) {
    parts.push(`Score Buró de Crédito: ${params.bureauScore}/850.`);
  }

  if (params.platformAvailable && params.platformGmv !== undefined) {
    parts.push(
      `GMV en Rappi: $${params.platformGmv.toLocaleString("es-MX")} MXN/mes.`
    );
  }

  return parts.join(" ");
}
