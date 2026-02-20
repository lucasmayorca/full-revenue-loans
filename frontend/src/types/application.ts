export type DecisionStatus =
  | "UNDERWRITING_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MANUAL_REVIEW";

export interface DecisionPayload {
  reason: string;
  syntage_monthly_revenue: number;   // ventas SAT (Syntage)
  google_signals_score: number;      // score 0-100 de señales Google
  total_revenue: number;             // ventas SAT + boost Google
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
  google_connected: boolean;
  google_business_url?: string;
}

export type AllFormData = Step1Data & Step2Data & Step3Data;
