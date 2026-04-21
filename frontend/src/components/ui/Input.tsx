"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "_");

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-[14px] font-medium text-black"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={[
            "w-full px-4 h-12 rounded-btn border text-[16px] leading-6 transition-colors bg-white text-black",
            "focus:outline-none focus:border-black focus:ring-1 focus:ring-black",
            error
              ? "border-uber-danger"
              : "border-uber-gray-300 hover:border-uber-gray-500",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {hint && !error && (
          <p className="text-[12px] text-uber-gray-500">{hint}</p>
        )}
        {error && (
          <p className="text-[12px] text-uber-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
