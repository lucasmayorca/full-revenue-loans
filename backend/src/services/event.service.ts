import { Timestamp } from "@google-cloud/firestore";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Registro en memoria de los eventos para poder consultarlos vía GET /events
 * sin depender de Firestore en el prototipo. Buffer circular de N eventos
 * (persistencia solo mientras el proceso está vivo — aceptable para feedback).
 */
export interface StoredEvent {
  event_name: string;
  merchant_id: string;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

const MAX_IN_MEMORY = 20_000;
const inMemoryEvents: StoredEvent[] = [];

export async function storeEvent(
  eventName: string,
  merchantId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  // Siempre guardamos en memoria para exponerlos vía GET /events
  inMemoryEvents.push({
    event_name: eventName,
    merchant_id: merchantId,
    metadata,
    timestamp: now,
  });
  if (inMemoryEvents.length > MAX_IN_MEMORY) {
    inMemoryEvents.splice(0, inMemoryEvents.length - MAX_IN_MEMORY);
  }

  if (env.DEMO_MODE) {
    logger.info("event_tracked", {
      event_name: eventName,
      merchant_id: merchantId,
      metadata,
    });
    return;
  }

  // En producción además persistimos en Firestore si está configurado
  try {
    const { getFirestore, COLLECTIONS } = require("../clients/firestoreClient");
    const db = getFirestore();
    await db.collection(COLLECTIONS.EVENTS).add({
      event_name: eventName,
      merchant_id: merchantId,
      metadata,
      timestamp: Timestamp.now(),
    });
  } catch (err) {
    // Firestore opcional — no romper el tracking si no está configurado
    logger.warn("firestore_event_write_failed", { err: String(err) });
  }
}

export function listEvents(options?: {
  since?: string;
  eventName?: string;
  sessionId?: string;
  limit?: number;
}): StoredEvent[] {
  let results = inMemoryEvents.slice();

  if (options?.since) {
    const sinceTs = new Date(options.since).getTime();
    if (!Number.isNaN(sinceTs)) {
      results = results.filter(
        (e) => new Date(e.timestamp).getTime() >= sinceTs
      );
    }
  }
  if (options?.eventName) {
    results = results.filter((e) => e.event_name === options.eventName);
  }
  if (options?.sessionId) {
    results = results.filter(
      (e) =>
        (e.metadata as { session_id?: string } | undefined)?.session_id ===
        options.sessionId
    );
  }

  // Más recientes primero
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (options?.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Métricas agregadas para el dashboard:
 * - total_sessions: sessions únicas
 * - banner_* / offer_card_*: para comparar interés banner vs cards
 * - funnel: sessions únicas por step del GamifiedFlow (dropoff)
 * - events_by_name: suma total por evento
 */
export function computeMetrics() {
  const uniqueSessions = new Set<string>();
  const eventsByName: Record<string, number> = {};

  const offersPageSessions = new Set<string>();
  const bannerViewSessions = new Set<string>();
  const bannerClickSessions = new Set<string>();
  const cardClickSessions = new Set<string>();
  const cardClicksByOffer: Record<string, Set<string>> = {};

  const stepViewedByStep: Record<string, Set<string>> = {};
  const stepCompletedByStep: Record<string, Set<string>> = {};

  const formStartedSessions = new Set<string>();
  const formSubmittedSessions = new Set<string>();
  const kycSubmittedSessions = new Set<string>();

  for (const e of inMemoryEvents) {
    eventsByName[e.event_name] = (eventsByName[e.event_name] ?? 0) + 1;
    const sid =
      (e.metadata as { session_id?: string } | undefined)?.session_id ?? null;
    if (sid) uniqueSessions.add(sid);

    switch (e.event_name) {
      case "offers_page_viewed":
        if (sid) offersPageSessions.add(sid);
        break;
      case "full_revenue_banner_viewed":
        if (sid) bannerViewSessions.add(sid);
        break;
      case "full_revenue_banner_clicked":
        if (sid) bannerClickSessions.add(sid);
        break;
      case "offer_card_select_clicked": {
        if (sid) cardClickSessions.add(sid);
        const offerId =
          (e.metadata as { offer_id?: string } | undefined)?.offer_id ??
          "unknown";
        if (!cardClicksByOffer[offerId]) cardClicksByOffer[offerId] = new Set();
        if (sid) cardClicksByOffer[offerId].add(sid);
        break;
      }
      case "full_revenue_step_viewed": {
        const step =
          (e.metadata as { step?: string } | undefined)?.step ?? "unknown";
        if (!stepViewedByStep[step]) stepViewedByStep[step] = new Set();
        if (sid) stepViewedByStep[step].add(sid);
        break;
      }
      case "full_revenue_step_completed": {
        const step =
          (e.metadata as { step?: string } | undefined)?.step ?? "unknown";
        if (!stepCompletedByStep[step]) stepCompletedByStep[step] = new Set();
        if (sid) stepCompletedByStep[step].add(sid);
        break;
      }
      case "full_revenue_form_started":
        if (sid) formStartedSessions.add(sid);
        break;
      case "full_revenue_form_submitted":
        if (sid) formSubmittedSessions.add(sid);
        break;
      case "kyc_submitted":
        if (sid) kycSubmittedSessions.add(sid);
        break;
    }
  }

  const FUNNEL_ORDER = [
    "identity",
    "consent",
    "offer1",
    "connections",
    "offer2",
    "fiscal",
    "offer3",
  ];

  const funnel = FUNNEL_ORDER.map((step) => {
    const viewed = stepViewedByStep[step]?.size ?? 0;
    const completed = stepCompletedByStep[step]?.size ?? 0;
    return {
      step,
      sessions_viewed: viewed,
      sessions_completed: completed,
      completion_rate: viewed > 0 ? completed / viewed : 0,
    };
  });

  const cardClicksByOfferCounts: Record<string, number> = {};
  for (const k of Object.keys(cardClicksByOffer)) {
    cardClicksByOfferCounts[k] = cardClicksByOffer[k].size;
  }

  return {
    generated_at: new Date().toISOString(),
    total_events: inMemoryEvents.length,
    events_by_name: eventsByName,
    unique_sessions: uniqueSessions.size,
    offers_page: {
      total_sessions: offersPageSessions.size,
      banner_sessions_viewed: bannerViewSessions.size,
      banner_sessions_clicked: bannerClickSessions.size,
      banner_click_through_rate:
        bannerViewSessions.size > 0
          ? bannerClickSessions.size / bannerViewSessions.size
          : 0,
      card_sessions_clicked: cardClickSessions.size,
      card_clicks_by_offer: cardClicksByOfferCounts,
    },
    funnel,
    form_started_sessions: formStartedSessions.size,
    form_submitted_sessions: formSubmittedSessions.size,
    kyc_submitted_sessions: kycSubmittedSessions.size,
  };
}
