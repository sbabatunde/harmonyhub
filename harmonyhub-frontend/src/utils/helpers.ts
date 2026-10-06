import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export const resolveAudioUrl = (src: string): string => {
  if (!src) return "";

  // Already a full URL (R2, external, blob, data) — return as-is
  if (/^(https?:|blob:|data:)/i.test(src)) return src;

  // Relative path fallback for local dev — use the configured API origin
  const base =
    import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ??
    "http://localhost:8000";
  return `${base}/storage/${src.replace(/^\/+/, "")}`;
};
