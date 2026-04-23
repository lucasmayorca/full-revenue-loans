"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "outline" | "outline-pill" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantClasses = {
  primary:
    "bg-black text-white hover:bg-uber-gray-900 active:bg-uber-gray-900 disabled:opacity-40",
  outline:
    "border border-black text-black bg-white hover:bg-uber-gray-100 active:bg-uber-gray-200",
  "outline-pill":
    "border-2 border-black text-black bg-white hover:bg-uber-gray-100 rounded-pill",
  ghost:
    "text-black hover:bg-uber-gray-100 active:bg-uber-gray-200",
};

const sizeClasses = {
  sm: "px-4 py-2 text-[14px]",
  md: "px-5 py-[10px] text-[16px] h-10",
  lg: "px-6 py-3 text-[16px] h-12",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isPill = variant === "outline-pill";
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={[
        "font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2",
        isPill ? "" : "rounded-btn",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
