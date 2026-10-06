import type { SuccessResponse } from "@/types";

/** Read the native `data` payload from a success response. */
export function pickDisplayData<T>(
  response: SuccessResponse<T> | undefined | null,
): T | undefined {
  return response?.data;
}
