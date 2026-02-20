import { Timestamp } from "@google-cloud/firestore";

export interface EventDoc {
  event_name: string;
  merchant_id: string;
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
}
