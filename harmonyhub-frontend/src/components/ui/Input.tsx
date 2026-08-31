import React, { forwardRef } from "react";
import { cn } from "@/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-loft-plum-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 border rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-loft-plum-500 focus:border-transparent",
            "bg-white text-loft-plum-900 placeholder-loft-plum-300",
            error ? "border-ember-coral-500" : "border-loft-plum-200",
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-sm text-loft-plum-500">{hint}</p>}
        {error && <p className="text-sm text-ember-coral-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
