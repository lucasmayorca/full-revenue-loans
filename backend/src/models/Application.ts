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
  google_connected: boolean;
  google_business_url?: string;
}

export interface DecisionPayload {
  reason: string;
  // Ventas estimadas (Syntage — SAT fiscal)
  syntage_monthly_revenue: number;
  // Señales digitales de Google (reseñas, tráfico, etc.)
  google_signals_score: number; // 0–100, score compuesto
  // Total ponderado para el underwriting
  total_revenue: number;
  threshold_used: number;
  data_sources: string[];
  decided_at: string;
}

// Datos completos de Syntage (SAT / fiscal)
export interface SyntageResult {
  merchant_id: string;
  annual_revenue: number;
  monthly_revenue: number;
  months_active: number;
  tax_regime?: string;
  cfdi_count_last_12m?: number;
  raw_response: Record<string, unknown>;
  fetched_at: string;
}

// Datos completos de Google (Business Profile + Analytics)
export interface GoogleBusinessData {
  // Google Business Profile
  business_name?: string;
  rating?: number;           // 1.0 – 5.0
  review_count?: number;
  is_verified?: boolean;
  categories?: string[];
  // Performance API (últimos 90 días)
  profile_views?: number;
  search_impressions?: number;
  direction_requests?: number;
  phone_calls?: number;
  website_clicks?: number;
  // Google Analytics (si tiene GA4 vinculado)
  ga4_monthly_sessions?: number;
  ga4_monthly_users?: number;
  ga4_estimated_revenue?: number; // purchaseRevenue MXN/mes
  // Meta
  data_points: number;
  fetched_at: string;
}

export interface GoogleResult {
  connected: boolean;
  business_data?: GoogleBusinessData;
  signals_score?: number; // 0–100 calculado
  raw_response?: Record<string, unknown>;
  fetched_at: string;
}

export interface ApplicationDoc {
  id: string;
  merchant_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  decision_status: DecisionStatus;
  form_data?: Partial<FormData>;
  syntage_result?: SyntageResult;
  google_result?: GoogleResult;
  google_access_token?: string;
  google_refresh_token?: string;
  decision_payload?: DecisionPayload;
  underwriting_notes?: string; // notas internas del revisor manual
}
