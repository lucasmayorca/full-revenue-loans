import { Timestamp } from "@google-cloud/firestore";

export type DecisionStatus =
  | "UNDERWRITING_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_REVIEW";

export interface FormData {
  legal_name: string;
  tax_id: string;
  ciec: string;
  address: string;
  email: string;
  monthly_revenue_estimate: number;
  revenue_sources: string[];
  notes?: string;
  consent_given: boolean;
  google_business_url?: string;
}

// ── Syntage / SAT ────────────────────────────────────────────────────────────
export interface SyntageResult {
  merchant_id: string;
  annual_revenue: number;
  monthly_revenue: number;
  months_active: number;
  tax_regime?: string;
  cfdi_count_last_12m?: number;
  tax_compliance?: boolean;          // true si no tiene deuda activa con SAT
  raw_response: Record<string, unknown>;
  fetched_at: string;
}

// ── Google Places (sin OAuth — solo URL pública de Maps) ─────────────────────
export interface PlacesResult {
  connected: boolean;
  place_id?: string;
  business_name?: string;
  rating?: number;                   // avg_rating (1.0–5.0)
  total_review_count?: number;       // total_review_count
  rating_trend_3m?: number;          // delta rating últimos 3 meses (estimado demo)
  listing_age_years?: number;        // business_maturity
  location_count?: number;           // diversification (número de sucursales)
  price_level_index?: number;        // 1–4 (proxy de margen)
  is_verified?: boolean;
  categories?: string[];
  has_website?: boolean;
  business_status?: string;          // OPERATIONAL / CLOSED_TEMPORARILY / etc.
  signals_score?: number;            // 0–100 compuesto
  fetched_at: string;
}

// ── Bureau de Crédito ────────────────────────────────────────────────────────
export interface BureauResult {
  bureau_score?: number;             // 300–850
  active_debt_amount?: number;       // MXN
  fetched_at: string;
}

// ── Platform (datos internos Rappi) ─────────────────────────────────────────
export interface PlatformResult {
  avg_platform_gmv_6m?: number;     // MXN/mes promedio últimos 6 meses en Rappi
  tenure_months?: number;            // meses activo en la plataforma
  fetched_at: string;
}

// ── Decision Payload (consolidado para analista) ─────────────────────────────
export interface DecisionPayload {
  reason: string;

  // Syntage / SAT
  syntage_monthly_revenue: number;
  syntage_tax_compliance: boolean;
  syntage_cfdi_count?: number;
  syntage_tax_regime?: string;

  // Google Places
  places_signals_score: number;      // 0–100
  places_rating?: number;
  places_review_count?: number;

  // Bureau de Crédito
  bureau_score?: number;

  // Platform (Rappi interno)
  platform_gmv_6m?: number;
  platform_tenure_months?: number;

  // Total ponderado para el analista
  total_revenue: number;
  threshold_used: number;
  data_sources: string[];
  decided_at: string;
}

// ── Application Document ─────────────────────────────────────────────────────
export interface ApplicationDoc {
  id: string;
  merchant_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  decision_status: DecisionStatus;
  form_data?: Partial<FormData>;
  syntage_result?: SyntageResult;
  places_result?: PlacesResult;
  bureau_result?: BureauResult;
  platform_result?: PlatformResult;
  decision_payload?: DecisionPayload;
  underwriting_notes?: string;
}
