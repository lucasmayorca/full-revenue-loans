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
            className="mt-1 w-[18px] h-[18px] rounded-[2px] border-uber-gray-500 text-black focus:ring-black focus:ring-offset-0 cursor-pointer flex-shrink-0 accent-black"
          />
          <span className="text-[14px] text-uber-gray-700 leading-5">{label}</span>
        </label>
        {error && (
          <p className="text-[12px] text-uber-danger ml-[30px]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
