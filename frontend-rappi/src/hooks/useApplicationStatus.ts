"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { Application, DecisionStatus } from "@/types/application";

const TERMINAL_STATES: DecisionStatus[] = [
  "APPROVED",
  "REJECTED",
  "MANUAL_REVIEW",
];
const POLL_INTERVAL_MS = 5000;

export function useApplicationStatus(applicationId: string) {
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const app = await api.getApplication(applicationId);
        if (!mounted) return;

        setApplication(app);

        if (TERMINAL_STATES.includes(app.decision_status)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        if (!mounted) return;
        setError("No se pudo obtener el estado de la solicitud");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }

    poll(); // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [applicationId]);

  const isLoading = !application && !error;

  return { application, error, isLoading };
}
