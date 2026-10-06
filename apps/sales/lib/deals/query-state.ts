import type { ListStatus } from "@orgtik/ui";

/** The HTTP status of an RTK Query error, or its kind ("FETCH_ERROR"…). */
export const errorStatus = (error: unknown): number | string | undefined =>
  error && typeof error === "object" && "status" in error ? (error as { status: number | string }).status : undefined;

/** A detail page's state: never an endless spinner (SAL-093, SAL-094). */
export type DetailState = "loading" | "ready" | "not-found" | "forbidden" | "error";

export function detailState({ isLoading, isError, error, hasData }: { isLoading: boolean; isError: boolean; error: unknown; hasData: boolean }): DetailState {
  if (isError) {
    const status = errorStatus(error);
    // The API answers 404 for a record that is someone else's, so a salesperson can't probe ids.
    if (status === 404) return "not-found";
    if (status === 403) return "forbidden";
    return "error";
  }
  if (hasData) return "ready";
  return isLoading ? "loading" : "error";
}

/** A list's state for the library DataTable. */
export function listStatus({ isLoading, isError, error, count }: { isLoading: boolean; isError: boolean; error: unknown; count: number }): ListStatus {
  if (isLoading) return "loading";
  if (isError) return errorStatus(error) === 403 ? "forbidden" : "error";
  return count ? "ready" : "empty";
}
