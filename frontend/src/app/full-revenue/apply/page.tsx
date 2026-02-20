import { Suspense } from "react";
import { ApplicationForm } from "@/components/full-revenue/ApplicationForm";
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
      <ApplicationForm />
    </Suspense>
  );
}
