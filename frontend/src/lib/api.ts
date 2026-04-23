import type { Application, AllFormData } from "@/types/application";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/full-revenue";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn("[api] NEXT_PUBLIC_API_URL no está configurada — usando fallback localhost");
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.error ?? "Request failed",
      body.details
    );
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export const api = {
  createApplication: (merchantId: string) =>
    request<{ id: string; decision_status: string }>(
      "/applications",
      {
        method: "POST",
        body: JSON.stringify({ merchant_id: merchantId }),
      }
    ),

  submitApplication: (id: string, formData: AllFormData) =>
    request<{ id: string; status: string; message: string }>(
      `/applications/${id}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ form_data: formData }),
      }
    ),

  getApplication: (id: string) =>
    request<Application>(`/applications/${id}`),

  prequalify: (id: string) =>
    request<{ base_amount: number; bureau_offer: number; social_offer: number; fiscal_offer: number }>(
      `/applications/${id}/prequal`
    ),

  submitConsent: (id: string, consent: { bureau_consent: true; twilio_consent: true; data_processing_consent: true }) =>
    request<{ message: string }>(
      `/applications/${id}/consent`,
      {
        method: "POST",
        body: JSON.stringify(consent),
      }
    ),

  submitKyc: async (
    id: string,
    personal: Record<string, string>,
    address: Record<string, string>,
    bank: Record<string, string>,
    files: { id_front: File; id_back: File; proof_of_address: File | null }
  ) => {
    const formData = new FormData();
    formData.append("personal", JSON.stringify(personal));
    formData.append("address", JSON.stringify(address));
    formData.append("bank", JSON.stringify(bank));
    formData.append("id_front", files.id_front);
    formData.append("id_back", files.id_back);
    if (files.proof_of_address) {
      formData.append("proof_of_address", files.proof_of_address);
    }

    const res = await fetch(`${BASE_URL}/applications/${id}/kyc`, {
      method: "POST",
      body: formData,
      // No Content-Type header — browser sets multipart boundary automatically
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? "KYC submission failed", body.details);
    }

    return res.json() as Promise<{ id: string; kyc_status: string; message: string }>;
  },

  trackEvent: (
    eventName: string,
    merchantId: string,
    metadata?: Record<string, unknown>
  ) =>
    request<void>("/events", {
      method: "POST",
      body: JSON.stringify({
        event_name: eventName,
        merchant_id: merchantId,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    }),

  getMetrics: () => request<MetricsResponse>("/events/metrics"),

  listEvents: (params?: {
    event_name?: string;
    session_id?: string;
    since?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.event_name) qs.set("event_name", params.event_name);
    if (params?.session_id) qs.set("session_id", params.session_id);
    if (params?.since) qs.set("since", params.since);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<EventsListResponse>(
      `/events${query ? `?${query}` : ""}`
    );
  },

  listApplications: (limit = 500) =>
    request<ApplicationsListResponse>(`/applications?limit=${limit}`),

  /* ── Prefill Links ── */
  generatePrefillLinks: (
    csv: string,
    options?: { base_url?: string; expires_in_days?: number }
  ) =>
    request<PrefillBulkResponse>("/prefill-links/bulk", {
      method: "POST",
      body: JSON.stringify({ csv, ...options }),
    }),

  getPrefillLink: (token: string) =>
    request<PrefillLinkResponse>(`/prefill/${token}`),

  listPrefillLinks: (limit = 500) =>
    request<{ count: number; links: PrefillLinkResponse[] }>(
      `/prefill-links?limit=${limit}`
    ),
};

export interface ApplicationsListResponse {
  count: number;
  applications: Array<{
    id: string;
    merchant_id: string;
    decision_status: string;
    kyc_status?: string;
    form_data?: Record<string, unknown>;
    decision_payload?: Record<string, unknown>;
    syntage_result?: Record<string, unknown>;
    places_result?: Record<string, unknown>;
    facebook_result?: Record<string, unknown>;
    instagram_result?: Record<string, unknown>;
    twilio_result?: Record<string, unknown>;
    bureau_result?: Record<string, unknown>;
    platform_result?: Record<string, unknown>;
    consent_data?: Record<string, unknown>;
    kyc_data?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
}

export interface MetricsResponse {
  generated_at: string;
  total_events: number;
  events_by_name: Record<string, number>;
  unique_sessions: number;
  offers_page: {
    total_sessions: number;
    banner_sessions_viewed: number;
    banner_sessions_clicked: number;
    banner_click_through_rate: number;
    card_sessions_clicked: number;
    card_clicks_by_offer: Record<string, number>;
  };
  funnel: Array<{
    step: string;
    sessions_viewed: number;
    sessions_completed: number;
    completion_rate: number;
  }>;
  form_started_sessions: number;
  form_submitted_sessions: number;
  kyc_submitted_sessions: number;
}

export interface PrefillOffer {
  id?: string;
  receive: number;
  retention?: number;
  totalToPay?: number;
  fixedFee?: number;
  monthlyMin?: number;
  maxTerm?: string;
}

export interface PrefillData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  curp?: string;
  birth_date?: string;
  nationality?: string;
  marital_status?: string;
  legal_name?: string;
  tax_id?: string;
  ciec?: string;
  address?: string;
  street?: string;
  neighborhood?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  clabe?: string;
  bank_name?: string;
  account_type?: string;
  account_holder?: string;
}

export interface PrefillLinkResponse {
  token: string;
  merchant_id: string | null;
  offers: PrefillOffer[] | null;
  base_amount: number | null;
  prefill: PrefillData | null;
  expires_at?: string | null;
  opened_at: string | null;
  used_at?: string | null;
  created_at?: string;
}

export interface PrefillBulkResponse {
  total: number;
  created: number;
  errors: Array<{ row: number; error: string }>;
  links: Array<{
    token: string;
    merchant_id: string | null;
    url: string;
  }>;
}

export interface EventsListResponse {
  count: number;
  events: Array<{
    event_name: string;
    merchant_id: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }>;
}
