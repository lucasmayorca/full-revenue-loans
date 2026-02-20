"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? "checkbox_" + label.slice(0, 10).replace(/\s+/g, "_");

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="flex items-start gap-3 cursor-pointer"
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            {...props}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-rappi-orange focus:ring-rappi-orange cursor-pointer flex-shrink-0"
          />
          <span className="text-sm text-gray-700 leading-relaxed">{label}</span>
        </label>
        {error && (
          <p className="text-xs text-red-600 ml-8" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
