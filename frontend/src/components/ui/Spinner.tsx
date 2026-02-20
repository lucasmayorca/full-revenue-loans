export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-3 border-gray-200 border-t-rappi-orange rounded-full animate-spin`}
      style={{ borderWidth: "3px", borderTopColor: "#FF441F" }}
      aria-label="Cargando..."
    />
  );
}
