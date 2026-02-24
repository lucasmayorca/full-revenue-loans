import type { Application, AllFormData } from "@/types/application";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

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
      "/full-revenue/applications",
      {
        method: "POST",
        body: JSON.stringify({ merchant_id: merchantId }),
      }
    ),

  submitApplication: (id: string, formData: AllFormData) =>
    request<{ id: string; status: string; message: string }>(
      `/full-revenue/applications/${id}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ form_data: formData }),
      }
    ),

  getApplication: (id: string) =>
    request<Application>(`/full-revenue/applications/${id}`),

  prequalify: (id: string) =>
    request<{ base_amount: number; bureau_offer: number; social_offer: number; fiscal_offer: number }>(
      `/full-revenue/applications/${id}/prequal`
    ),

  submitConsent: (id: string, consent: { bureau_consent: true; twilio_consent: true; data_processing_consent: true }) =>
    request<{ message: string }>(
      `/full-revenue/applications/${id}/consent`,
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

    const res = await fetch(`${BASE_URL}/full-revenue/applications/${id}/kyc`, {
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
};
