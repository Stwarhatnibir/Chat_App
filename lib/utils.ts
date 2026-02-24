import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format message timestamp for sidebar preview
 * Today: "2:34 PM"
 * This year: "Feb 15"
 * Older: "Feb 15, 2023"
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (isThisYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format message timestamp for inside chat
 * Today: "2:34 PM"
 * Older same year: "Feb 15, 2:34 PM"
 * Different year: "Feb 15, 2023, 2:34 PM"
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;

  if (isThisYear) {
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dateStr}, ${time}`;
  }

  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${dateStr}, ${time}`;
}
