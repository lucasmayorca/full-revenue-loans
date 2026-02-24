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

  // Total ponderado
  total_revenue: number;
  threshold_used: number;
  data_sources: string[];
  decided_at: string;

  // Oferta de crédito final
  credit_offer?: CreditOffer;
}

export interface CreditOffer {
  approved_amount: number;        // Monto aprobado en MXN
  interest_rate_monthly: number;  // Tasa mensual ej: 0.035 = 3.5%
  installments: number;           // Cantidad de cuotas (meses)
  monthly_payment: number;        // Cuota mensual total en MXN
  withholding_amount: number;     // Monto retenido por la plataforma por mes
  direct_debit_amount: number;    // Monto cobrado por débito directo si retención insuficiente
  currency: string;               // "MXN"
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
  tax_id?: string;
  ciec?: string;
  address: string;
  phone?: string;
  email: string;
}

export interface Step2Data {
  google_business_url?: string;
  facebook_access_token?: string;
  instagram_access_token?: string;
}

export interface Step3Data {
  consent_given: true;
}

export type AllFormData = Step1Data & Step2Data & Step3Data;
