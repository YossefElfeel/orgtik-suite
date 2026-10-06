import type {
  TicketNoteAttachment,
  TicketPriority,
  TicketStatus,
} from "@/types/tickets";

/** Highest page size accepted by the tickets API. */
export const TICKET_NOTES_PAGE_SIZE = 20;

/** Attachment size limit accepted by the notes endpoint. */
export const TICKET_NOTE_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ticketStatusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/**
 * Builds attachment metadata from a signed note file URL, which only carries
 * the file name.
 */
export function buildTicketNoteAttachment(
  fileUrl: string,
): TicketNoteAttachment {
  return { url: fileUrl, name: getFileNameFromUrl(fileUrl) };
}

function getFileNameFromUrl(fileUrl: string): string {
  const fallback = "Attachment";

  try {
    const url = new URL(fileUrl, "http://localhost");
    const source = url.searchParams.get("key") ?? url.pathname;
    const name = decodeURIComponent(source).split("/").filter(Boolean).at(-1);

    return name || fallback;
  } catch {
    return fallback;
  }
}
