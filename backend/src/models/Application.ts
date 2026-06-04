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
export interface SyntageCounterparty {
  rfc: string;
  name?: string;
  invoiced_amount_12m: number;       // MXN facturado a/desde esta contraparte
  share_of_revenue: number;          // 0–1 (porcentaje de ingresos totales)
}

export interface SyntageResult {
  merchant_id: string;
  annual_revenue: number;
  monthly_revenue: number;
  months_active: number;
  tax_regime?: string;
  cfdi_count_last_12m?: number;
  tax_compliance?: boolean;                       // true si no tiene deuda activa con SAT
  // Cashflow real (Step 3 — Full Fiscal Validation)
  avg_monthly_invoiced_inflows_6m?: number;       // MXN/mes facturado a clientes (entradas)
  avg_monthly_invoiced_outflows_6m?: number;      // MXN/mes facturado a proveedores (salidas)
  avg_monthly_fiscal_net_flow_6m?: number;        // Inflows - Outflows (capacidad de pago efectiva)
  invoiced_revenue_std_dev_6m?: number;           // Volatilidad de ingresos fiscales
  fs_operating_margin?: number;                   // Margen operativo (estados financieros) 0–1
  fs_net_income_year?: number;                    // Utilidad neta anual MXN
  active_tax_debt_amount?: number;                // Monto de deuda activa con SAT (MXN)
  invoice_cancelation_ratio_6m?: number;          // % de CFDIs cancelados (0–1) — anti-inflado
  counterparty_tax_fraud_flag_rate?: number;      // % de contrapartes en lista negra SAT (0–1)
  cfdi_top_counterparties?: SyntageCounterparty[]; // Top clientes — concentración
  cfdi_payment_method_split?: {                   // Split de método de pago en CFDIs
    pue_ratio: number;                            // PUE (pago en una exhibición) 0–1
    ppd_ratio: number;                            // PPD (pago en parcialidades) 0–1
  };
  raw_response: Record<string, unknown>;
  fetched_at: string;
}

// ── Google Places (sin OAuth — solo URL pública de Maps) ─────────────────────
export interface PlacesReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;                     // unix timestamp
  relative_time_description?: string;
}

export interface PlacesOpeningHours {
  open_now?: boolean;
  weekday_text?: string[];           // textos por día
  weekly_open_hours?: number;        // horas totales abiertas por semana
}

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
  // Cross-check con KYC
  formatted_address?: string;        // dirección formateada por Google
  formatted_phone_number?: string;
  international_phone_number?: string;
  // Geolocalización
  geometry?: {
    lat: number;
    lng: number;
  };
  // Horarios
  opening_hours?: PlacesOpeningHours;
  permanently_closed?: boolean;
  // Calidad de listing
  photo_count?: number;              // # fotos en listing
  reviews?: PlacesReview[];          // primeras N reseñas (sentiment)
  editorial_summary?: string;        // descripción editorial de Google
  fetched_at: string;
}

// ── Facebook Pages ───────────────────────────────────────────────────────────
export interface FacebookResult {
  connected: boolean;
  // Identidad básica (public_profile + email) — siempre devuelve esto si OAuth completó
  user_id?: string;
  user_name?: string;
  user_email?: string;
  // Identidad enriquecida (requiere scopes adicionales — disponibles en demo)
  user_picture_url?: string;
  user_verified?: boolean;        // perfil personal verificado por Meta
  user_profile_link?: string;     // URL del perfil
  // Datos de Page (requiere pages_show_list + pages_read_engagement)
  page_id?: string;
  page_name?: string;
  fan_count?: number;             // seguidores de la página
  rating?: number;                // rating 1–5 (si tiene reseñas habilitadas)
  review_count?: number;
  is_verified?: boolean;
  website?: string;
  // Tenure social
  page_created_time?: string;     // fecha creación de la Page (ISO)
  page_age_years?: number;        // años desde creación
  // Categorización
  category?: string;
  category_list?: string[];
  // Cross-check con KYC
  page_phone?: string;
  page_emails?: string[];
  page_address?: string;          // single_line_address
  page_location?: {
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
  };
  // Tracción
  checkins?: number;              // # check-ins de clientes
  talking_about_count?: number;   // engagement reciente
  were_here_count?: number;       // gente que reportó haber estado
  posts_last_30d?: number;        // frecuencia de posteo
  avg_reactions_per_post?: number; // engagement promedio (likes+amor+wow) por post
  avg_comments_per_post?: number;  // comentarios promedio por post (Facebook)
  // Status / kill switches
  is_published?: boolean;
  is_permanently_closed?: boolean;
  // Estructura corporativa
  parent_page_id?: string;        // si es franquicia / multi-sucursal
  // Maturity de catálogo
  payment_options?: string[];
  price_range?: string;           // "$" / "$$" / "$$$" / "$$$$"
  restaurant_specialties?: string[];
  fetched_at: string;
}

// ── Instagram Business ───────────────────────────────────────────────────────
export interface InstagramMediaSample {
  id?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
}

export interface InstagramInsights {
  reach_28d?: number;
  impressions_28d?: number;
  profile_views_28d?: number;
}

export interface InstagramResult {
  connected: boolean;
  username?: string;
  name?: string;                 // nombre display
  biography?: string;
  website?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;          // cantidad de posts
  is_business?: boolean;
  // Engagement real (mejor proxy que followers crudos)
  recent_media?: InstagramMediaSample[]; // últimos N posts
  avg_likes_per_post?: number;
  avg_comments_per_post?: number;
  engagement_rate?: number;      // (avg likes + comments) / followers
  posts_last_30d?: number;       // frecuencia de posteo
  // Insights (requiere instagram_manage_insights)
  insights?: InstagramInsights;
  // Comercio
  shopping_product_tag_eligibility?: boolean;
  fetched_at: string;
}

// ── Twilio Lookup (Identity Match + WhatsApp Business + Antifraude) ──────────
export interface TwilioResult {
  connected: boolean;
  phone_number?: string;
  // Identity Match
  identity_match?: boolean;         // true si nombre coincide con registros del operador
  name_match_score?: string;        // "high" | "medium" | "low" | "no_data"
  first_name_match?: string;        // exact | high | medium | low | no_match | no_data
  last_name_match?: string;         // idem (apellido)
  date_of_birth_match?: string;     // idem (fecha nacimiento)
  national_id_match?: string;       // idem (RFC / national ID) — anti-suplantación
  // Identity Match — dirección (cross-check con KYC)
  address_line_1_match?: string;
  address_city_match?: string;
  address_state_match?: string;
  address_postal_code_match?: string;
  address_country_match?: string;
  // WhatsApp Business
  whatsapp_business?: boolean;      // true si tiene cuenta de WhatsApp Business activa
  // Line Intelligence
  line_type?: string;               // "mobile" | "landline" | "voip" | "toll_free"
  carrier_name?: string;
  caller_name?: string;             // CNAM — nombre con el que está registrado el número
  country_code?: string;
  // Antifraude — SIM Swap con buckets extendidos
  sim_swap_detected?: boolean;      // true si hubo cambio de SIM en últimas 24-72h
  sim_swap_period?: string;         // PT24H | P7D | P30D | P90D | P180D | P1Y | none
  call_forwarding_enabled?: boolean;    // true si llamadas están siendo desviadas
  // Line Intelligence detallado
  prepaid_flag?: boolean;               // true = prepago, false = postpago
  mobile_country_code?: string;         // MCC (334 = México)
  mobile_network_code?: string;         // MNC (ej 020 = Telcel)
  // Reassigned Number (add-on)
  reassigned_number?: boolean;          // true si fue reasignado recientemente a otra persona
  // Validación básica
  is_valid?: boolean;                   // número válido + activable
  validation_errors?: string[];
  // Score nativo de Twilio (si está disponible)
  phone_number_quality_score?: number;  // 0-100 (Twilio puede devolverlo en algunos planes)
  // Tenure del número
  number_tenure_days?: number;          // días activo con el carrier
  number_tenure_bucket?: "new" | "recent" | "established"; // <30d / 30-180d / >180d
  // Score agregado antifraude (calculado por nosotros)
  risk_score?: number;                  // 0-100 (100 = más seguro)
  risk_flags?: string[];                // lista de señales negativas
  fetched_at: string;
}

// ── Bureau de Crédito ────────────────────────────────────────────────────────
export interface BureauResult {
  bureau_score?: number;                // 300–850
  active_debt_amount?: number;          // MXN
  // Comportamiento de pago
  active_delinquency_flag?: boolean;    // true si tiene mora activa
  worst_status_24m?: string;            // peor MOP histórico (ej "MOP-3" = 90d atraso)
  // Capacidad y exposición
  credit_utilization_ratio?: number;    // saldo / límite total (0–1)
  total_credit_limit?: number;          // MXN
  total_balance?: number;               // MXN
  // Demanda de crédito reciente (stress signal)
  recent_inquiries_6m?: number;         // # hard pulls últimos 6 meses
  // Historial
  oldest_tradeline_age_months?: number; // meses desde apertura más antigua
  total_tradelines?: number;            // # cuentas reportadas
  // Mix
  mix_of_credit?: {
    consumer?: number;                  // # cuentas consumo
    mortgage?: number;                  // # hipotecarias
    auto?: number;                      // # automotor
    business?: number;                  // # comerciales
  };
  fetched_at: string;
}

// ── Platform (datos internos Rappi) ─────────────────────────────────────────
export interface PlatformResult {
  avg_platform_gmv_6m?: number;             // MXN/mes promedio últimos 6 meses en Rappi
  tenure_months?: number;                    // meses activo en la plataforma
  pre_approved_amount?: number;              // oferta pre-aprobada basada en ventas Rappi
  // Volatilidad & tendencia
  platform_gmv_volatility_6m?: number;       // std dev / mean de GMV (coef variación)
  gmv_growth_3m?: number;                    // % crecimiento últimos 3m vs 3m previos
  gmv_growth_12m?: number;                   // % crecimiento últimos 12m vs 12m previos
  // Calidad operativa
  cancellation_rate?: number;                // % órdenes canceladas (0–1)
  refund_rate?: number;                      // % órdenes con reembolso (0–1)
  // Mix volumen vs ticket
  avg_ticket_size?: number;                  // MXN ticket promedio
  orders_per_day?: number;                   // # órdenes/día promedio
  repeat_customer_rate?: number;             // % órdenes de clientes recurrentes (0–1)
  // Historial de repago (refills — más fuerte señal del piloto)
  previous_loans_count?: number;
  previous_loans_repaid_on_time_rate?: number; // 0–1
  split_pay_capacity_utilization?: number;   // % del cap de retención usado (0–1)
  // Estacionalidad
  weekday_vs_weekend_ratio?: number;         // GMV weekday / GMV weekend
  peak_hour_concentration?: number;          // % de GMV en top 4 horas del día (0–1)
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
  facebook_composite_score?: number;      // score 0–100 con todas las señales
  facebook_engagement_per_post?: number;  // reacciones promedio por post

  // Instagram Business
  instagram_followers?: number;
  instagram_media_count?: number;
  instagram_composite_score?: number;     // score 0–100 con todas las señales
  instagram_engagement_rate?: number;     // engagement rate real (likes+comments/followers)

  // Twilio Lookup
  twilio_identity_match?: boolean;
  twilio_whatsapp_business?: boolean;
  twilio_sim_swap_detected?: boolean;
  twilio_line_type?: string;
  twilio_call_forwarding?: boolean;
  twilio_prepaid?: boolean;
  twilio_carrier_detail?: string;    // "Telcel post-pago"
  twilio_number_tenure?: string;     // "established" | "recent" | "new"
  twilio_risk_score?: number;        // 0-100
  twilio_risk_flags?: string[];

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
