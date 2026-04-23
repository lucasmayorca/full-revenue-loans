"use client";

import { useCallback } from "react";
import { track, EventName } from "@/lib/tracking";

export function useTracking() {
  const trackEvent = useCallback(
    (eventName: EventName, metadata?: Record<string, unknown>) => {
      track(eventName, metadata);
    },
    []
  );

  return { trackEvent };
}
