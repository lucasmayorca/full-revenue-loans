import type { DecisionStatus } from "@/types/application";

const CONFIG: Record<
  DecisionStatus,
  { label: string; classes: string; dot: string }
> = {
  UNDERWRITING_PENDING: {
    label: "En proceso",
    classes: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500 animate-pulse",
  },
  APPROVED: {
    label: "Aprobado",
    classes: "bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "No aprobado",
    classes: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
  MANUAL_REVIEW: {
    label: "En revisión",
    classes: "bg-orange-100 text-orange-800",
    dot: "bg-rappi-orange animate-pulse",
  },
};

export function StatusBadge({ status }: { status: DecisionStatus }) {
  const config = CONFIG[status];
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.classes}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}
