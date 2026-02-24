import { Suspense } from "react";
import { GamifiedApplicationForm } from "@/components/full-revenue/GamifiedFlow";
import { Spinner } from "@/components/ui/Spinner";

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <GamifiedApplicationForm />
    </Suspense>
  );
}
