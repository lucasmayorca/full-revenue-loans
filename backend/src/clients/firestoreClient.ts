import { Firestore } from "@google-cloud/firestore";
import { env } from "../config/env";

let instance: Firestore | null = null;

export function getFirestore(): Firestore {
  if (!instance) {
    instance = new Firestore({
      projectId: env.GCP_PROJECT_ID,
      // FIRESTORE_EMULATOR_HOST env var is auto-detected by the SDK
    });
  }
  return instance;
}

export const COLLECTIONS = {
  APPLICATIONS: "applications",
  EVENTS: "events",
} as const;
