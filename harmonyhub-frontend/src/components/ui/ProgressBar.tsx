import React from "react";
import { cn } from "@/utils/helpers";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "sage" | "gold" | "plum";
  showLabel?: boolean;
  className?: string;
}

const colorStyles = {
  sage: "bg-choir-sage-500",
  gold: "bg-brass-gold-400",
  plum: "bg-loft-plum-600",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = "sage",
  showLabel = false,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-2 bg-loft-plum-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            colorStyles[color],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-loft-plum-600">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};
