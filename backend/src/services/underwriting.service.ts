import { syntageClient } from "../clients/syntageClient";
import { googlePlacesClient } from "../clients/googleClient";
import { facebookClient, instagramClient } from "../clients/facebookClient";
import { twilioClient } from "../clients/twilioClient";
import { bureauClient } from "../clients/bureauClient";
import { platformClient } from "../clients/platformClient";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { withTimeout } from "../utils/timeout";
import {
  ApplicationDoc,
  CreditOffer,
  DecisionPayload,
  DecisionStatus,
  SyntageResult,
  PlacesResult,
  FacebookResult,
  InstagramResult,
  TwilioResult,
  BureauResult,
  PlatformResult,
} from "../models/Application";

export interface UnderwritingDecision {
  status: DecisionStatus;
  payload: DecisionPayload;
  syntage_result?: SyntageResult;
  places_result?: PlacesResult;
  facebook_result?: FacebookResult;
  instagram_result?: InstagramResult;
  twilio_result?: TwilioResult;
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
  const facebookToken = application.form_data?.facebook_access_token ?? "";
  const instagramToken = application.form_data?.instagram_access_token ?? "";
  // Datos de identidad para Twilio Lookup
  const phone = application.form_data?.phone ?? "";
  const legalName = application.form_data?.legal_name ?? "";
  const [firstName, ...lastParts] = legalName.trim().split(" ");
  const lastName = lastParts.join(" ");

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
    });
  } catch (err) {
    logger.warn("syntage_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 2. Google Places (URL pública de Maps) ──────────────────────────────────
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
          signals_score: placesScore,
        });
      }
    } catch (err) {
      logger.warn("google_places_fetch_failed", { ...logCtx, error: String(err) });
      placesResult = { connected: false, fetched_at: new Date().toISOString() };
    }
  } else {
    placesResult = { connected: false, fetched_at: new Date().toISOString() };
  }

  // ── 3. Facebook Pages (OAuth) ────────────────────────────────────────────────
  let facebookResult: FacebookResult | undefined;
  let facebookFanCount: number | undefined;
  let facebookAvailable = false;

  if (facebookToken || env.DEMO_MODE) {
    try {
      const fb = await withTimeout(
        facebookClient.getPageData(facebookToken),
        8000,
        "Facebook fetch timed out"
      );

      facebookResult = fb;

      if (fb.connected) {
        facebookFanCount = fb.fan_count;
        facebookAvailable = true;

        logger.info("facebook_data_fetched", {
          ...logCtx,
          page_name: fb.page_name,
          fan_count: fb.fan_count,
        });
      }
    } catch (err) {
      logger.warn("facebook_fetch_failed", { ...logCtx, error: String(err) });
      facebookResult = { connected: false, fetched_at: new Date().toISOString() };
    }
  } else {
    facebookResult = { connected: false, fetched_at: new Date().toISOString() };
  }

  // ── 4. Instagram Business (OAuth via Facebook) ───────────────────────────────
  let instagramResult: InstagramResult | undefined;
  let instagramFollowers: number | undefined;
  let instagramAvailable = false;

  if (instagramToken || facebookToken || env.DEMO_MODE) {
    try {
      const ig = await withTimeout(
        instagramClient.getProfileData(instagramToken || facebookToken),
        8000,
        "Instagram fetch timed out"
      );

      instagramResult = ig;

      if (ig.connected) {
        instagramFollowers = ig.followers_count;
        instagramAvailable = true;

        logger.info("instagram_data_fetched", {
          ...logCtx,
          username: ig.username,
          followers: ig.followers_count,
        });
      }
    } catch (err) {
      logger.warn("instagram_fetch_failed", { ...logCtx, error: String(err) });
      instagramResult = { connected: false, fetched_at: new Date().toISOString() };
    }
  } else {
    instagramResult = { connected: false, fetched_at: new Date().toISOString() };
  }

  // ── 5. Twilio Lookup (Identity Match + WhatsApp Business) ───────────────────
  let twilioResult: TwilioResult | undefined;
  let twilioIdentityMatch: boolean | undefined;
  let twilioWhatsapp: boolean | undefined;
  let twilioSimSwap: boolean | undefined;
  let twilioAvailable = false;

  try {
    const twilio = await withTimeout(
      twilioClient.verifyPhone(phone || "+525500000000", firstName, lastName),
      8000,
      "Twilio Lookup timed out"
    );

    twilioResult = twilio;

    if (twilio.connected) {
      twilioIdentityMatch = twilio.identity_match;
      twilioWhatsapp = twilio.whatsapp_business;
      twilioSimSwap = twilio.sim_swap_detected;
      twilioAvailable = true;

      logger.info("twilio_lookup_done", {
        ...logCtx,
        identity_match: twilioIdentityMatch,
        whatsapp_business: twilioWhatsapp,
        sim_swap: twilioSimSwap,
      });
    }
  } catch (err) {
    logger.warn("twilio_lookup_failed", { ...logCtx, error: String(err) });
    twilioResult = { connected: false, fetched_at: new Date().toISOString() };
  }

  // ── 7. Bureau de Crédito ────────────────────────────────────────────────────
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
      });
    }
  } catch (err) {
    logger.warn("bureau_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 8. Platform (Rappi interno) ─────────────────────────────────────────────
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
        pre_approved_amount: platform.pre_approved_amount,
      });
    }
  } catch (err) {
    logger.warn("platform_fetch_failed", { ...logCtx, error: String(err) });
  }

  // ── 9. Consolidar y calcular total ponderado ────────────────────────────────
  const dataSources = [
    ...(syntageAvailable ? ["syntage"] : []),
    ...(placesAvailable ? ["google_places"] : []),
    ...(facebookAvailable ? ["facebook"] : []),
    ...(instagramAvailable ? ["instagram"] : []),
    ...(twilioAvailable ? ["twilio"] : []),
    ...(bureauAvailable ? ["bureau"] : []),
    ...(platformAvailable ? ["platform"] : []),
  ];

  const totalRevenue = computeTotalRevenue(
    syntageMonthlyRevenue,
    placesScore,
    bureauScore,
    tenureMonths,
    syntageCompliance,
    facebookFanCount,
    instagramFollowers,
    twilioIdentityMatch,
    twilioWhatsapp,
    twilioSimSwap
  );

  // ── 10. Calcular oferta de crédito ─────────────────────────────────────────
  // Base = oferta pre-aprobada de Rappi (ventas plataforma), multiplicadores fijos por tier
  const preApprovedBase = platformResult?.pre_approved_amount ?? 50_000;
  const hasSocial = placesAvailable || facebookAvailable || instagramAvailable;
  const hasFiscal = syntageAvailable;
  const creditOffer = computeCreditOffer(
    preApprovedBase,
    bureauScore,
    dataSources.length,
    hasSocial,
    hasFiscal
  );

  // ── 11. Determinar estado ─────────────────────────────────────────────────
  const status: DecisionStatus = totalRevenue >= env.APPROVAL_THRESHOLD
    ? "APPROVED"
    : totalRevenue > 0
    ? "MANUAL_REVIEW"
    : "REJECTED";

  const payload: DecisionPayload = {
    credit_offer: creditOffer,
    reason: buildReason({
      syntageAvailable,
      placesAvailable,
      facebookAvailable,
      instagramAvailable,
      twilioAvailable,
      bureauAvailable,
      platformAvailable,
      syntageMonthlyRevenue,
      placesScore,
      bureauScore,
      platformGmv,
      syntageCompliance,
      facebookFanCount,
      instagramFollowers,
      twilioIdentityMatch,
      twilioWhatsapp,
      twilioSimSwap,
    }),
    syntage_monthly_revenue: syntageMonthlyRevenue,
    syntage_tax_compliance: syntageCompliance,
    syntage_cfdi_count: syntageResult?.cfdi_count_last_12m,
    syntage_tax_regime: syntageResult?.tax_regime,
    places_signals_score: placesScore,
    places_rating: placesResult?.rating,
    places_review_count: placesResult?.total_review_count,
    facebook_fan_count: facebookFanCount,
    facebook_rating: facebookResult?.rating,
    instagram_followers: instagramFollowers,
    instagram_media_count: instagramResult?.media_count,
    twilio_identity_match: twilioIdentityMatch,
    twilio_whatsapp_business: twilioWhatsapp,
    twilio_sim_swap_detected: twilioSimSwap,
    twilio_line_type: twilioResult?.line_type,
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
    total_revenue: totalRevenue,
    data_sources: dataSources,
  });

  return {
    status,
    payload,
    syntage_result: syntageResult,
    places_result: placesResult,
    facebook_result: facebookResult,
    instagram_result: instagramResult,
    twilio_result: twilioResult,
    bureau_result: bureauResult,
    platform_result: platformResult,
  };
}

/**
 * Ingreso total ponderado para el analista.
 * Boost máximo acumulable por fuentes digitales: ~35%
 */
function computeTotalRevenue(
  syntageMonthly: number,
  placesScore: number,
  bureauScore: number | undefined,
  tenureMonths: number | undefined,
  taxCompliance: boolean,
  facebookFans: number | undefined,
  instagramFollowers: number | undefined,
  twilioIdentityMatch: boolean | undefined,
  twilioWhatsapp: boolean | undefined,
  twilioSimSwap: boolean | undefined
): number {
  if (syntageMonthly === 0) return 0;

  // Google Places: boost máx 20%
  const placesBoost = 1 + (placesScore / 100) * 0.20;

  // Facebook: boost máx 8% según tamaño de comunidad
  const facebookBoost =
    facebookFans === undefined ? 0
    : facebookFans >= 5000     ? 0.08
    : facebookFans >= 1000     ? 0.05
    :                            0.02;

  // Instagram: boost máx 7% según seguidores
  const instagramBoost =
    instagramFollowers === undefined ? 0
    : instagramFollowers >= 5000     ? 0.07
    : instagramFollowers >= 1000     ? 0.04
    :                                  0.01;

  const socialBoost = 1 + facebookBoost + instagramBoost;

  // Twilio Identity Match: +5% si nombre coincide con operador (confianza de identidad)
  const identityBoost = twilioIdentityMatch === true ? 1.05 : 1.0;

  // WhatsApp Business: +3% si tiene cuenta de WhatsApp Business activa
  const whatsappBoost = twilioWhatsapp === true ? 1.03 : 1.0;

  // SIM Swap reciente: penalización -10% (señal de fraude)
  const simSwapPenalty = twilioSimSwap === true ? 0.90 : 1.0;

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
    syntageMonthly *
    placesBoost *
    socialBoost *
    identityBoost *
    whatsappBoost *
    simSwapPenalty *
    bureauMultiplier *
    tenureMultiplier *
    complianceMultiplier
  );
}

function buildReason(params: {
  syntageAvailable: boolean;
  placesAvailable: boolean;
  facebookAvailable: boolean;
  instagramAvailable: boolean;
  twilioAvailable: boolean;
  bureauAvailable: boolean;
  platformAvailable: boolean;
  syntageMonthlyRevenue: number;
  placesScore: number;
  bureauScore: number | undefined;
  platformGmv: number | undefined;
  syntageCompliance: boolean;
  facebookFanCount: number | undefined;
  instagramFollowers: number | undefined;
  twilioIdentityMatch: boolean | undefined;
  twilioWhatsapp: boolean | undefined;
  twilioSimSwap: boolean | undefined;
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
  if (params.facebookAvailable && params.facebookFanCount !== undefined) {
    parts.push(`Facebook: ${params.facebookFanCount.toLocaleString("es-MX")} seguidores.`);
  }
  if (params.instagramAvailable && params.instagramFollowers !== undefined) {
    parts.push(`Instagram: ${params.instagramFollowers.toLocaleString("es-MX")} seguidores.`);
  }
  if (params.twilioAvailable) {
    const twilioNotes: string[] = [];
    if (params.twilioIdentityMatch === true) twilioNotes.push("identidad verificada ✓");
    if (params.twilioWhatsapp === true) twilioNotes.push("WhatsApp Business activo ✓");
    if (params.twilioSimSwap === true) twilioNotes.push("⚠️ SIM swap reciente detectado");
    if (twilioNotes.length > 0) parts.push(`Twilio Lookup: ${twilioNotes.join(", ")}.`);
  }
  if (params.bureauAvailable && params.bureauScore !== undefined) {
    parts.push(`Score Buró de Crédito: ${params.bureauScore}/850.`);
  }
  if (params.platformAvailable && params.platformGmv !== undefined) {
    parts.push(`GMV en Rappi: $${params.platformGmv.toLocaleString("es-MX")} MXN/mes.`);
  }

  return parts.join(" ");
}

/**
 * Calcula la oferta de crédito usando multiplicadores fijos sobre el ingreso base.
 *
 * La base (syntageMonthly) varía por merchant. Los multiplicadores son fijos:
 *  - Solo buró:               base × 1.5
 *  - Buró + social:           base × 2.0
 *  - Buró + social + fiscal:  base × 4.0
 *
 * La tasa y condiciones varían según el bureau score.
 * Repago: 20% retención de ventas Rappi + débito directo del remanente.
 */
function computeCreditOffer(
  baseRevenue: number,
  bureauScore: number | undefined,
  dataSourceCount: number,
  hasSocial: boolean = false,
  hasFiscal: boolean = false
): CreditOffer {
  // Fixed multipliers, variable base
  const multiplier = hasFiscal ? 4.0 : hasSocial ? 2.0 : 1.5;
  const approvedAmount = Math.round((baseRevenue * multiplier) / 1000) * 1000;

  // Tasa mensual basada en bureau score
  const rate =
    bureauScore !== undefined && bureauScore > 700 ? 0.030
    : bureauScore !== undefined && bureauScore > 600 ? 0.034
    :                                                  0.038;

  const installments = 12;

  // Cuota mensual: fórmula de anualidad
  const monthlyPayment = Math.round(
    (approvedAmount * rate) / (1 - Math.pow(1 + rate, -installments))
  );

  // Repago: 20% retención Rappi + débito directo del remanente
  const withholdingAmount = Math.round(monthlyPayment * 0.20);
  const directDebitAmount = monthlyPayment - withholdingAmount;

  return {
    approved_amount: approvedAmount,
    interest_rate_monthly: rate,
    installments,
    monthly_payment: monthlyPayment,
    withholding_amount: withholdingAmount,
    direct_debit_amount: directDebitAmount,
    currency: "MXN",
  };
}

/**
 * Pre-calificación ligera: obtiene la oferta pre-aprobada de Rappi (ventas plataforma)
 * y aplica los multiplicadores fijos:
 *  - Base:   pre_approved_amount (oferta pre-aprobada de Rappi)
 *  - Buró:   base × 1.5
 *  - Social: base × 2.0
 *  - Fiscal: base × 4.0
 */
export async function runPrequalification(
  merchantId: string
): Promise<{ base_amount: number; bureau_offer: number; social_offer: number; fiscal_offer: number }> {
  let baseAmount = 50_000; // fallback

  try {
    const platform = await withTimeout(
      platformClient.getMerchantData(merchantId),
      5000,
      "Platform prequal timed out"
    );
    if (platform.pre_approved_amount) {
      baseAmount = platform.pre_approved_amount;
    }
  } catch {
    // fallback to default
  }

  // Fixed multipliers applied to pre-approved base
  const bureauOffer = Math.round((baseAmount * 1.5) / 1000) * 1000;
  const socialOffer = Math.round((baseAmount * 2.0) / 1000) * 1000;
  const fiscalOffer = Math.round((baseAmount * 4.0) / 1000) * 1000;

  logger.info("prequal_completed", {
    merchant_id: merchantId,
    base_amount: baseAmount,
    bureau_offer: bureauOffer,
    social_offer: socialOffer,
    fiscal_offer: fiscalOffer,
  });

  return { base_amount: baseAmount, bureau_offer: bureauOffer, social_offer: socialOffer, fiscal_offer: fiscalOffer };
}
