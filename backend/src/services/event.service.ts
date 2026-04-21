import { logger } from "../utils/logger";
import { isPgEnabled, query } from "../clients/pgClient";

/**
 * Eventos para tracking. Escritos a Postgres (si DATABASE_URL está set) y
 * mantenidos en memoria para queries rápidas y agregaciones del dashboard.
 * Al bootear se hidrata el buffer in-memory desde Postgres.
 */
export interface StoredEvent {
  event_name: string;
  merchant_id: string;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

const MAX_IN_MEMORY = 20_000;
const inMemoryEvents: StoredEvent[] = [];
let hydrated = false;

/**
 * Hidrata inMemoryEvents desde Postgres en boot. Idempotente.
 * Llamado lazy desde listEvents/computeMetrics para no requerir cambios en index.ts.
 */
async function hydrateFromPg(): Promise<void> {
  if (hydrated || !isPgEnabled()) {
    hydrated = true;
    return;
  }
  try {
    const res = await query(
      `SELECT event_name, session_id, payload, created_at
       FROM events
       ORDER BY created_at DESC
       LIMIT $1`,
      [MAX_IN_MEMORY]
    );
    // Insertamos en orden cronológico ascendente (los más viejos primero)
    const rows = res.rows.reverse();
    for (const row of rows as Array<{ event_name: string; session_id: string | null; payload: Record<string, unknown> | null; created_at: Date }>) {
      const meta = (row.payload ?? {}) as Record<string, unknown>;
      if (row.session_id && !meta.session_id) meta.session_id = row.session_id;
      inMemoryEvents.push({
        event_name: row.event_name,
        merchant_id: (meta.merchant_id as string) ?? "",
        metadata: meta,
        timestamp: row.created_at.toISOString(),
      });
    }
    hydrated = true;
    logger.info("events_hydrated_from_pg", { count: inMemoryEvents.length });
  } catch (err) {
    logger.warn("events_hydrate_failed", { error: String(err) });
    hydrated = true; // no reintentar
  }
}

export async function storeEvent(
  eventName: string,
  merchantId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await hydrateFromPg();
  const now = new Date().toISOString();

  inMemoryEvents.push({
    event_name: eventName,
    merchant_id: merchantId,
    metadata,
    timestamp: now,
  });
  if (inMemoryEvents.length > MAX_IN_MEMORY) {
    inMemoryEvents.splice(0, inMemoryEvents.length - MAX_IN_MEMORY);
  }

  if (!isPgEnabled()) {
    logger.info("event_tracked_in_memory", {
      event_name: eventName,
      merchant_id: merchantId,
    });
    return;
  }

  // Persistir en Postgres
  try {
    const sessionId =
      (metadata as { session_id?: string } | undefined)?.session_id ?? null;
    const payload = { ...(metadata ?? {}), merchant_id: merchantId };
    await query(
      `INSERT INTO events (session_id, event_name, payload) VALUES ($1, $2, $3::jsonb)`,
      [sessionId, eventName, JSON.stringify(payload)]
    );
  } catch (err) {
    logger.warn("pg_event_write_failed", { err: String(err) });
  }
}

export async function listEvents(options?: {
  since?: string;
  eventName?: string;
  sessionId?: string;
  limit?: number;
}): Promise<StoredEvent[]> {
  await hydrateFromPg();
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
export async function computeMetrics() {
  await hydrateFromPg();
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
