import { Timestamp } from "@google-cloud/firestore";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export async function storeEvent(
  eventName: string,
  merchantId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (env.DEMO_MODE) {
    // In demo mode just log the event — no Firestore needed
    logger.info("event_tracked", { event_name: eventName, merchant_id: merchantId, metadata });
    return;
  }

  const { getFirestore, COLLECTIONS } = require("../clients/firestoreClient");
  const db = getFirestore();
  await db.collection(COLLECTIONS.EVENTS).add({
    event_name: eventName,
    merchant_id: merchantId,
    metadata,
    timestamp: Timestamp.now(),
  });
}
