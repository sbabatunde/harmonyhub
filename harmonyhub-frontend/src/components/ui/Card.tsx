import React from "react";
import { cn } from "@/utils/helpers";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl shadow-loft border border-loft-plum-100",
        "p-6 transition-all duration-200",
        hoverable && "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
};
