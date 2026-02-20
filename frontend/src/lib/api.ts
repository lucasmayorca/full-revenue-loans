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
