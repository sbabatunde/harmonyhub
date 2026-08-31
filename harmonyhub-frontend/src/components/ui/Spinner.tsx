import React from "react";
import { cn } from "@/utils/helpers";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-loft-plum-200 border-t-loft-plum-600",
          sizeStyles[size],
        )}
      />
    </div>
  );
};
