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
  const rawPhone = application.form_data?.phone ?? "";
  // Normalizar a E.164 para México: si llega sin +, agregar +52
  const phone = rawPhone.startsWith("+")
    ? rawPhone
    : rawPhone.length === 10
    ? `+52${rawPhone}`
    : rawPhone.length === 12 && rawPhone.startsWith("52")
    ? `+${rawPhone}`
    : rawPhone || "+525500000000";
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
      // Cashflow real
      avg_monthly_invoiced_inflows_6m: raw.avg_monthly_invoiced_inflows_6m,
      avg_monthly_invoiced_outflows_6m: raw.avg_monthly_invoiced_outflows_6m,
      avg_monthly_fiscal_net_flow_6m: raw.avg_monthly_fiscal_net_flow_6m,
      invoiced_revenue_std_dev_6m: raw.invoiced_revenue_std_dev_6m,
      // Salud operativa
      fs_operating_margin: raw.fs_operating_margin,
      fs_net_income_year: raw.fs_net_income_year,
      // Compliance
      active_tax_debt_amount: raw.active_tax_debt_amount,
      invoice_cancelation_ratio_6m: raw.invoice_cancelation_ratio_6m,
      counterparty_tax_fraud_flag_rate: raw.counterparty_tax_fraud_flag_rate,
      // Concentración / mix
      cfdi_top_counterparties: raw.cfdi_top_counterparties,
      cfdi_payment_method_split: raw.cfdi_payment_method_split,
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

  // ── 5. Twilio Lookup (Identity + WhatsApp + Antifraude full) ─────────────────
  let twilioResult: TwilioResult | undefined;
  let twilioIdentityMatch: boolean | undefined;
  let twilioWhatsapp: boolean | undefined;
  let twilioSimSwap: boolean | undefined;
  let twilioCallForwarding: boolean | undefined;
  let twilioPrepaid: boolean | undefined;
  let twilioTenure: "new" | "recent" | "established" | undefined;
  let twilioRiskScore: number | undefined;
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
      twilioCallForwarding = twilio.call_forwarding_enabled;
      twilioPrepaid = twilio.prepaid_flag;
      twilioTenure = twilio.number_tenure_bucket;
      twilioRiskScore = twilio.risk_score;
      twilioAvailable = true;

      logger.info("twilio_lookup_done", {
        ...logCtx,
        identity_match: twilioIdentityMatch,
        whatsapp_business: twilioWhatsapp,
        sim_swap: twilioSimSwap,
        call_forwarding: twilioCallForwarding,
        prepaid: twilioPrepaid,
        tenure: twilioTenure,
        risk_score: twilioRiskScore,
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
    facebookResult,
    instagramResult,
    twilioIdentityMatch,
    twilioWhatsapp,
    twilioSimSwap,
    twilioCallForwarding,
    twilioPrepaid,
    twilioTenure,
    twilioRiskScore
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

  // Calcular scores sociales para incluir en el payload
  const fbCompositeScore = facebookResult?.connected ? computeFacebookScore(facebookResult) : 0;
  const igCompositeScore = instagramResult?.connected ? computeInstagramScore(instagramResult) : 0;

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
      facebookCompositeScore: fbCompositeScore,
      instagramCompositeScore: igCompositeScore,
      facebookEngagementPerPost: facebookResult?.avg_reactions_per_post,
      instagramEngagementRate: instagramResult?.engagement_rate,
      twilioIdentityMatch,
      twilioWhatsapp,
      twilioSimSwap,
      twilioCallForwarding,
      twilioPrepaid,
      twilioTenure,
      twilioRiskScore,
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
    facebook_composite_score: fbCompositeScore || undefined,
    facebook_engagement_per_post: facebookResult?.avg_reactions_per_post,
    instagram_followers: instagramFollowers,
    instagram_media_count: instagramResult?.media_count,
    instagram_composite_score: igCompositeScore || undefined,
    instagram_engagement_rate: instagramResult?.engagement_rate,
    twilio_identity_match: twilioIdentityMatch,
    twilio_whatsapp_business: twilioWhatsapp,
    twilio_sim_swap_detected: twilioSimSwap,
    twilio_line_type: twilioResult?.line_type,
    twilio_call_forwarding: twilioCallForwarding,
    twilio_prepaid: twilioPrepaid,
    twilio_carrier_detail: twilioResult?.carrier_name
      ? `${twilioResult.carrier_name}${
          twilioPrepaid === false ? " post-pago" : twilioPrepaid === true ? " prepago" : ""
        }`
      : undefined,
    twilio_number_tenure: twilioTenure,
    twilio_risk_score: twilioRiskScore,
    twilio_risk_flags: twilioResult?.risk_flags,
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
 * Score compuesto de Facebook (0–100).
 * Usa todas las señales disponibles, no solo fan_count.
 */
function computeFacebookScore(fb: FacebookResult): number {
  if (!fb.connected || fb.is_permanently_closed) return 0;

  let score = 0;

  // Comunidad — fan_count: máx 25 pts (escala logarítmica para evitar sesgo de compra)
  if (fb.fan_count !== undefined) {
    if (fb.fan_count >= 50_000) score += 25;
    else if (fb.fan_count >= 10_000) score += 20;
    else if (fb.fan_count >= 5_000)  score += 15;
    else if (fb.fan_count >= 1_000)  score += 10;
    else if (fb.fan_count >= 200)    score += 5;
  }

  // Reputación — rating: máx 20 pts
  if (fb.rating !== undefined && fb.rating > 0) {
    score += Math.round(((fb.rating - 1) / 4) * 20);
  }

  // Volumen de reseñas — máx 10 pts
  if (fb.review_count !== undefined) {
    if (fb.review_count >= 500)      score += 10;
    else if (fb.review_count >= 200) score += 8;
    else if (fb.review_count >= 50)  score += 5;
    else if (fb.review_count >= 10)  score += 2;
  }

  // Madurez — page_age_years: máx 10 pts
  if (fb.page_age_years !== undefined) {
    if (fb.page_age_years >= 5)      score += 10;
    else if (fb.page_age_years >= 3) score += 7;
    else if (fb.page_age_years >= 1) score += 4;
  }

  // Presencia física — were_here_count + checkins: máx 10 pts
  const physicalSignal = (fb.were_here_count ?? 0) + (fb.checkins ?? 0);
  if (physicalSignal >= 1000)      score += 10;
  else if (physicalSignal >= 200)  score += 7;
  else if (physicalSignal >= 50)   score += 4;

  // Engagement de posts — reactions: máx 10 pts
  const avgReactions = fb.avg_reactions_per_post ?? (fb.talking_about_count ? Math.round(fb.talking_about_count / 10) : 0);
  if (avgReactions >= 100)      score += 10;
  else if (avgReactions >= 30)  score += 7;
  else if (avgReactions >= 10)  score += 4;
  else if (avgReactions >= 1)   score += 1;

  // Actividad reciente — posts_last_30d: máx 10 pts
  if (fb.posts_last_30d !== undefined) {
    if (fb.posts_last_30d >= 12)     score += 10;
    else if (fb.posts_last_30d >= 6) score += 7;
    else if (fb.posts_last_30d >= 2) score += 4;
    else if (fb.posts_last_30d >= 1) score += 2;
  }

  // Verificación — +5 pts
  if (fb.is_verified) score += 5;

  return Math.min(score, 100);
}

/**
 * Score compuesto de Instagram (0–100).
 * Prioriza engagement_rate sobre follower count (calidad vs cantidad).
 */
function computeInstagramScore(ig: InstagramResult): number {
  if (!ig.connected) return 0;

  let score = 0;

  // Engagement rate — señal más importante (máx 40 pts)
  // Tasa promedio para negocios: 1–3%. >5% es excelente.
  if (ig.engagement_rate !== undefined) {
    if (ig.engagement_rate >= 0.08)      score += 40;
    else if (ig.engagement_rate >= 0.05) score += 32;
    else if (ig.engagement_rate >= 0.03) score += 24;
    else if (ig.engagement_rate >= 0.01) score += 14;
    else                                  score += 5;
  }

  // Seguidores — secundario (máx 25 pts)
  if (ig.followers_count !== undefined) {
    if (ig.followers_count >= 50_000)      score += 25;
    else if (ig.followers_count >= 10_000) score += 20;
    else if (ig.followers_count >= 5_000)  score += 15;
    else if (ig.followers_count >= 1_000)  score += 10;
    else if (ig.followers_count >= 200)    score += 4;
  }

  // Actividad reciente — posts_last_30d: máx 15 pts
  if (ig.posts_last_30d !== undefined) {
    if (ig.posts_last_30d >= 16)     score += 15;
    else if (ig.posts_last_30d >= 8) score += 10;
    else if (ig.posts_last_30d >= 4) score += 6;
    else if (ig.posts_last_30d >= 1) score += 3;
  }

  // Historial de contenido — media_count: máx 10 pts
  if (ig.media_count !== undefined) {
    if (ig.media_count >= 200)      score += 10;
    else if (ig.media_count >= 50)  score += 6;
    else if (ig.media_count >= 10)  score += 3;
  }

  // Cuenta de negocio — +5 pts
  if (ig.is_business) score += 5;

  // Reach orgánico — insights: +5 pts extra si disponible
  if (ig.insights?.reach_28d && ig.followers_count && ig.insights.reach_28d > ig.followers_count) {
    score += 5; // reach supera a seguidores → audiencia amplificada
  }

  return Math.min(score, 100);
}

/**
 * Ingreso total ponderado para el analista.
 * Social boost ahora usa scores compuestos en vez de solo fan_count/followers.
 * Multiplicadores Twilio sumados: identity +5%, WhatsApp +3%, post-pago +3%,
 * tenure established +3%, SIM swap -10%, call forwarding -15%, new number -10%,
 * risk_score < 50 -8% (reaseguro compuesto).
 */
function computeTotalRevenue(
  syntageMonthly: number,
  placesScore: number,
  bureauScore: number | undefined,
  tenureMonths: number | undefined,
  taxCompliance: boolean,
  facebookResult: FacebookResult | undefined,
  instagramResult: InstagramResult | undefined,
  twilioIdentityMatch: boolean | undefined,
  twilioWhatsapp: boolean | undefined,
  twilioSimSwap: boolean | undefined,
  twilioCallForwarding: boolean | undefined,
  twilioPrepaid: boolean | undefined,
  twilioTenure: "new" | "recent" | "established" | undefined,
  twilioRiskScore: number | undefined
): number {
  if (syntageMonthly === 0) return 0;

  // Google Places: boost máx 20%
  const placesBoost = 1 + (placesScore / 100) * 0.20;

  // Facebook: score compuesto 0–100 → boost 0–12%
  const fbScore = facebookResult?.connected ? computeFacebookScore(facebookResult) : 0;
  const facebookBoost = (fbScore / 100) * 0.12;

  // Instagram: score compuesto 0–100 → boost 0–10%
  const igScore = instagramResult?.connected ? computeInstagramScore(instagramResult) : 0;
  const instagramBoost = (igScore / 100) * 0.10;

  const socialBoost = 1 + facebookBoost + instagramBoost;

  // Twilio Identity Match: +5%
  const identityBoost = twilioIdentityMatch === true ? 1.05 : 1.0;

  // WhatsApp Business: +3%
  const whatsappBoost = twilioWhatsapp === true ? 1.03 : 1.0;

  // SIM Swap reciente: -10%
  const simSwapPenalty = twilioSimSwap === true ? 0.90 : 1.0;

  // Call forwarding activo: -15% (fuerte antifraude)
  const callForwardingPenalty = twilioCallForwarding === true ? 0.85 : 1.0;

  // Postpago = +3% / prepago = -2% (estabilidad del cliente)
  const prepaidMultiplier =
    twilioPrepaid === false ? 1.03
    : twilioPrepaid === true ? 0.98
    : 1.0;

  // Tenure del número: established +3% / new -10%
  const numberTenureMultiplier =
    twilioTenure === "established" ? 1.03
    : twilioTenure === "new"         ? 0.90
    : 1.0;

  // Reaseguro compuesto si risk_score es muy bajo
  const riskScorePenalty =
    twilioRiskScore !== undefined && twilioRiskScore < 50 ? 0.92 : 1.0;

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
    callForwardingPenalty *
    prepaidMultiplier *
    numberTenureMultiplier *
    riskScorePenalty *
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
  facebookCompositeScore: number;
  instagramCompositeScore: number;
  facebookEngagementPerPost: number | undefined;
  instagramEngagementRate: number | undefined;
  twilioIdentityMatch: boolean | undefined;
  twilioWhatsapp: boolean | undefined;
  twilioSimSwap: boolean | undefined;
  twilioCallForwarding: boolean | undefined;
  twilioPrepaid: boolean | undefined;
  twilioTenure: "new" | "recent" | "established" | undefined;
  twilioRiskScore: number | undefined;
}): string {
  const parts: string[] = [
    "Solicitud en revisión manual para determinar nuevo monto Financiamiento MÁS.",
  ];

  if (params.syntageAvailable) {
    parts.push(
      `Ventas SAT: $${params.syntageMonthlyRevenue.toLocaleString("es-MX")} MXN/mes.` +
        (!params.syntageCompliance ? " ALERTA: Deuda activa con SAT detectada." : "")
    );
  } else {
    parts.push("Datos SAT no disponibles — requiere verificación manual.");
  }

  if (params.placesAvailable) {
    parts.push(`Score Google Places: ${params.placesScore}/100.`);
  }
  if (params.facebookAvailable && params.facebookFanCount !== undefined) {
    const fbParts = [`${params.facebookFanCount.toLocaleString("es-MX")} fans`];
    if (params.facebookCompositeScore > 0) fbParts.push(`score ${params.facebookCompositeScore}/100`);
    if (params.facebookEngagementPerPost !== undefined) fbParts.push(`${params.facebookEngagementPerPost} reacciones/post`);
    parts.push(`Facebook: ${fbParts.join(", ")}.`);
  }
  if (params.instagramAvailable && params.instagramFollowers !== undefined) {
    const igParts = [`${params.instagramFollowers.toLocaleString("es-MX")} seguidores`];
    if (params.instagramCompositeScore > 0) igParts.push(`score ${params.instagramCompositeScore}/100`);
    if (params.instagramEngagementRate !== undefined) igParts.push(`${(params.instagramEngagementRate * 100).toFixed(1)}% engagement`);
    parts.push(`Instagram: ${igParts.join(", ")}.`);
  }
  if (params.twilioAvailable) {
    const twilioNotes: string[] = [];
    if (params.twilioIdentityMatch === true) twilioNotes.push("identidad verificada ✓");
    if (params.twilioWhatsapp === true) twilioNotes.push("WhatsApp Business activo ✓");
    if (params.twilioPrepaid === false) twilioNotes.push("post-pago ✓");
    if (params.twilioTenure === "established") twilioNotes.push("número establecido ✓");
    if (params.twilioTenure === "new") twilioNotes.push("⚠️ número reciente");
    if (params.twilioSimSwap === true) twilioNotes.push("⚠️ SIM swap reciente");
    if (params.twilioCallForwarding === true) twilioNotes.push("⚠️ desvío de llamadas activo");
    if (params.twilioRiskScore !== undefined) twilioNotes.push(`risk ${params.twilioRiskScore}/100`);
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
  let baseAmount = 62_800; // fallback

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

  // Fixed multipliers applied to pre-approved base (1.25x / 1.5x / 3x)
  const bureauOffer = Math.round((baseAmount * 1.25) / 100) * 100;
  const socialOffer = Math.round((baseAmount * 1.5)  / 100) * 100;
  const fiscalOffer = Math.round((baseAmount * 3.0)  / 100) * 100;

  logger.info("prequal_completed", {
    merchant_id: merchantId,
    base_amount: baseAmount,
    bureau_offer: bureauOffer,
    social_offer: socialOffer,
    fiscal_offer: fiscalOffer,
  });

  return { base_amount: baseAmount, bureau_offer: bureauOffer, social_offer: socialOffer, fiscal_offer: fiscalOffer };
}
