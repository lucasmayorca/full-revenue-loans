"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Suspense } from "react";

// The actual OAuth callback is handled server-side by the backend.
// The backend redirects to /full-revenue/apply?google=connected&appId=xxx
// This page exists as a fallback if the user lands here directly.
function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const appId = searchParams.get("appId");
    const google = searchParams.get("google");

    if (appId && google === "connected") {
      // Pass params to apply page
      router.replace(
        `/full-revenue/apply?google=connected&appId=${appId}`
      );
    } else {
      // Something went wrong; go back to apply
      router.replace("/full-revenue/apply");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500">Conectando con Google...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Spinner size="lg" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
