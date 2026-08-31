import React from "react";
import { cn } from "@/utils/helpers";

interface BadgeProps {
  variant?: "sage" | "gold" | "coral" | "plum" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  sage: "bg-choir-sage-100 text-choir-sage-800",
  gold: "bg-brass-gold-100 text-brass-gold-800",
  coral: "bg-ember-coral-100 text-ember-coral-800",
  plum: "bg-loft-plum-100 text-loft-plum-800",
  neutral: "bg-gray-100 text-gray-700",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
