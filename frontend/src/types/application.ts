export type DecisionStatus =
  | "UNDERWRITING_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_REVIEW";

export interface DecisionPayload {
  reason: string;

  // Syntage / SAT
  syntage_monthly_revenue: number;
  syntage_tax_compliance: boolean;
  syntage_cfdi_count?: number;
  syntage_tax_regime?: string;

  // Google Places
  places_signals_score: number;       // 0–100
  places_rating?: number;
  places_review_count?: number;

  // Bureau de Crédito
  bureau_score?: number;

  // Platform (Rappi interno)
  platform_gmv_6m?: number;
  platform_tenure_months?: number;

  // Total ponderado
  total_revenue: number;
  threshold_used: number;
  data_sources: string[];
  decided_at: string;
}

export interface Application {
  id: string;
  merchant_id: string;
  decision_status: DecisionStatus;
  form_data?: Record<string, unknown>;
  decision_payload?: DecisionPayload;
  created_at: string;
  updated_at: string;
}

export interface Step1Data {
  legal_name: string;
  tax_id: string;
  ciec: string;
  address: string;
  email: string;
}

export interface Step2Data {
  monthly_revenue_estimate: number;
  revenue_sources: string[];
  notes?: string;
}

export interface Step3Data {
  consent_given: true;
  google_business_url?: string;
}

export type AllFormData = Step1Data & Step2Data & Step3Data;
