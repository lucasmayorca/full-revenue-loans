import { api } from "./api";

export const EVENTS = {
  BANNER_VIEWED: "full_revenue_banner_viewed",
  BANNER_CLICKED: "full_revenue_banner_clicked",
  PRODUCT_PAGE_VIEWED: "full_revenue_product_page_viewed",
  CONTINUE_CLICKED: "full_revenue_continue_clicked",
  FORM_STARTED: "full_revenue_form_started",
  STEP_COMPLETED: "full_revenue_step_completed",
  FORM_SUBMITTED: "full_revenue_form_submitted",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Demo merchant ID — in production this comes from auth context
export const DEMO_MERCHANT_ID = "demo-merchant-001";

// Fire-and-forget — never throws, never blocks user action
export function track(
  eventName: EventName,
  metadata?: Record<string, unknown>
): void {
  api.trackEvent(eventName, DEMO_MERCHANT_ID, metadata).catch(() => {
    // Silent failure: tracking must never break UX
  });
}
