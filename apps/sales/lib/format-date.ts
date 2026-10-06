import { formatDistanceToNowStrict } from "date-fns";

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "-";

  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const datePart = dateStr.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }

  // Fallback for full parsing
  const date = new Date(dateStr as any);
  if (Number.isNaN(date.getTime())) return String(dateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Formats ISO datetime as `Jun 20, 2026 at 01:00 AM`. */
export function formatDateTime(dateStr: string): string {
  if (!dateStr || typeof dateStr === "object") return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime()))
    return typeof dateStr === "string" ? dateStr : "—";

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

/** Formats ISO datetime as `23/04/2025 at 09:15 Am`. */
export function formatSlashDateTime(dateStr: string): string {
  if (!dateStr || typeof dateStr === "object") return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime()))
    return typeof dateStr === "string" ? dateStr : "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const period = date.getHours() >= 12 ? "Pm" : "Am";
  const hours = String(date.getHours() % 12 || 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} at ${hours}:${minutes} ${period}`;
}

/** Formats ISO datetime as `Jan 2, 2026`. */
export function formatShortDate(dateStr: string): string {
  if (!dateStr || typeof dateStr === "object") return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime()))
    return typeof dateStr === "string" ? dateStr : "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats ISO datetime as a relative label, e.g. `2 days ago`. */
export function formatTimeAgo(dateStr: string): string {
  if (!dateStr || typeof dateStr === "object") return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime()))
    return typeof dateStr === "string" ? dateStr : "—";

  return `${formatDistanceToNowStrict(date)} ago`;
}
