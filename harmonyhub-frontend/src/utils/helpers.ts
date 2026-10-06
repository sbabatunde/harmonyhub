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
  if (/^(https?:|blob:|data:)/i.test(src)) return src;

  // src from the backend is a relative path like "ai-processed/song_9_instrumental.wav"
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const base = apiUrl
    ? apiUrl.replace(/\/api\/?$/, "")
    : "http://localhost:8000";
  const cleaned = src.replace(/^\/+/, "").replace(/^storage\//, "");
  return `${base}/storage/${cleaned}`;
};
