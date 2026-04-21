import { api } from "./api";

/**
 * Eventos del prototipo.
 *
 * - `offers_*` y `full_revenue_banner_*` miden qué hace el usuario en el feed
 *   (/offers) — especialmente qué card clickea (RBF regular vs Préstamo MÁS).
 * - `full_revenue_*` cubren el flujo embebido (Step viewed + completed).
 * - Todo evento se enriquece con `session_id` persistente en localStorage para
 *   medir conversión por visitante anónimo (links compartidos sin auth).
 */
export const EVENTS = {
  // Landing /offers
  OFFERS_PAGE_VIEWED: "offers_page_viewed",
  OFFERS_TAB_CHANGED: "offers_tab_changed",

  // Banner Préstamo MÁS (competitivo vs cards RBF)
  BANNER_VIEWED: "full_revenue_banner_viewed",
  BANNER_CLICKED: "full_revenue_banner_clicked",

  // Cards RBF regulares
  OFFER_CARD_VIEWED: "offer_card_viewed",
  OFFER_CARD_SELECT_CLICKED: "offer_card_select_clicked",
  OFFER_DETAILS_TOGGLED: "offer_details_toggled",

  // Info page Préstamo MÁS
  PRODUCT_PAGE_VIEWED: "full_revenue_product_page_viewed",
  CONTINUE_CLICKED: "full_revenue_continue_clicked",

  // Flujo GamifiedFlow — funnel de steps
  STEP_VIEWED: "full_revenue_step_viewed",
  STEP_COMPLETED: "full_revenue_step_completed",
  FORM_STARTED: "full_revenue_form_started",
  FORM_SUBMITTED: "full_revenue_form_submitted",

  // KYC post-aprobación
  KYC_STEP_VIEWED: "kyc_step_viewed",
  KYC_SUBMITTED: "kyc_submitted",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Demo merchant ID — en producción viene del auth context
export const DEMO_MERCHANT_ID = "demo-merchant-001";

const SESSION_KEY = "fr_session_id";

/**
 * Genera (o retorna existente) un session_id persistente por visitante.
 * Clave para medir conversión/dropoff cuando compartimos el link a merchants
 * sin autenticación — todos los eventos de una misma sesión quedan ligados.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = generateId();
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "no-storage";
  }
}

function generateId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Fire-and-forget — nunca tira error, nunca bloquea UX.
 * Enriquece el metadata con session_id, timestamp cliente y path actual.
 */
export function track(
  eventName: EventName,
  metadata?: Record<string, unknown>
): void {
  const enriched = {
    ...(metadata ?? {}),
    session_id: getSessionId(),
    client_timestamp: new Date().toISOString(),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
  };
  api.trackEvent(eventName, DEMO_MERCHANT_ID, enriched).catch(() => {
    // Silent: tracking nunca debe romper UX
  });
}
