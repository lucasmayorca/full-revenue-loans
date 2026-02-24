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
  phone?: string;
  email: string;
  consent_given: boolean;
  // Opcional — URL pública de Google Maps (sin OAuth)
  google_business_url?: string;
  // OAuth tokens — guardados tras el callback de cada plataforma
  facebook_access_token?: string;
  instagram_access_token?: string;
  google_oauth_access_token?: string;
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

// ── Facebook Pages ───────────────────────────────────────────────────────────
export interface FacebookResult {
  connected: boolean;
  page_name?: string;
  fan_count?: number;           // seguidores de la página
  rating?: number;              // rating 1–5 (si tiene reseñas habilitadas)
  review_count?: number;
  is_verified?: boolean;
  website?: string;
  fetched_at: string;
}

// ── Instagram Business ───────────────────────────────────────────────────────
export interface InstagramResult {
  connected: boolean;
  username?: string;
  followers_count?: number;
  media_count?: number;         // cantidad de posts
  is_business?: boolean;
  fetched_at: string;
}

// ── Twilio Lookup (Identity Match + WhatsApp Business) ───────────────────────
export interface TwilioResult {
  connected: boolean;
  phone_number?: string;
  // Identity Match
  identity_match?: boolean;         // true si nombre coincide con registros del operador
  name_match_score?: string;        // "high" | "medium" | "low" | "no_data"
  // WhatsApp Business
  whatsapp_business?: boolean;      // true si tiene cuenta de WhatsApp Business activa
  // Line Intelligence
  line_type?: string;               // "mobile" | "landline" | "voip" | "toll_free"
  // Antifraude
  sim_swap_detected?: boolean;      // true si hubo cambio de SIM en últimas 24-72h
  carrier_name?: string;
  country_code?: string;
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
  pre_approved_amount?: number;      // oferta de crédito pre-aprobada basada en ventas Rappi
  fetched_at: string;
}

// ── Oferta de crédito calculada ──────────────────────────────────────────────
export interface CreditOffer {
  approved_amount: number;        // Monto aprobado en MXN
  interest_rate_monthly: number;  // Tasa mensual ej: 0.035 = 3.5%
  installments: number;           // Cantidad de cuotas (meses)
  monthly_payment: number;        // Cuota mensual total en MXN
  withholding_amount: number;     // Monto retenido por la plataforma por mes
  direct_debit_amount: number;    // Monto cobrado por débito directo si retención insuficiente
  currency: string;               // "MXN"
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

  // Facebook Pages
  facebook_fan_count?: number;
  facebook_rating?: number;

  // Instagram Business
  instagram_followers?: number;
  instagram_media_count?: number;

  // Twilio Lookup
  twilio_identity_match?: boolean;
  twilio_whatsapp_business?: boolean;
  twilio_sim_swap_detected?: boolean;
  twilio_line_type?: string;

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

  // Oferta de crédito calculada
  credit_offer?: CreditOffer;
}

// ── KYC Data (post-aprobación) ───────────────────────────────────────────────
export type KycStatus = "NOT_STARTED" | "SUBMITTED" | "VERIFIED" | "REJECTED";

export interface KycPersonalData {
  first_name: string;
  last_name: string;
  birth_date: string;
  cedula: string;  // RFC (12-13 chars)
  nationality: string;
  marital_status: string;
}

export interface KycAddressData {
  street: string;
  neighborhood?: string;
  postal_code: string;
  city: string;
  state: string;
}

export interface KycBankData {
  clabe: string;
  bank_name: string;
  account_type: string;
  account_holder: string;
}

export interface KycDocuments {
  id_front_path: string;
  id_back_path: string;
  proof_of_address_path: string | null;
}

export interface KycData {
  personal: KycPersonalData;
  address: KycAddressData;
  bank: KycBankData;
  documents: KycDocuments;
  submitted_at: string;
}

// ── Consent data ────────────────────────────────────────────────────────────
export interface ConsentData {
  bureau_consent: boolean;
  twilio_consent: boolean;
  data_processing_consent: boolean;
  consented_at: string;
}

// ── Application Document ─────────────────────────────────────────────────────
export interface ApplicationDoc {
  id: string;
  merchant_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  decision_status: DecisionStatus;
  form_data?: Partial<FormData>;
  consent_data?: ConsentData;
  syntage_result?: SyntageResult;
  places_result?: PlacesResult;
  facebook_result?: FacebookResult;
  instagram_result?: InstagramResult;
  twilio_result?: TwilioResult;
  bureau_result?: BureauResult;
  platform_result?: PlatformResult;
  decision_payload?: DecisionPayload;
  underwriting_notes?: string;
  kyc_status?: KycStatus;
  kyc_data?: KycData;
}
