"use client";

import { useRouter } from "next/navigation";

export default function FullRevenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-[1200px] mx-auto px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-uber-gray-700 hover:text-black transition-colors"
          aria-label="Volver"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>
      </div>
      {children}
    </div>
  );
}
