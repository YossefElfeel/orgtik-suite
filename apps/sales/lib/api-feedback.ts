// What a change says when it lands or fails, in the reader's language. The API's own messages
// were toasted as they came, in English whatever the reader's language, and every failed read
// toasted too (MKT-032). Now baseApi asks this registry, which ApiFeedback fills with translated
// messages once the language is known.
//
// Reads never toast: lists show their own error state. An endpoint whose screen says the result
// itself (a wizard step, a comment in its thread) is quiet.

export type FeedbackContext = {
  endpoint: string;
  args: unknown;
  /** The answer's `data` on success (the created or renamed item, when the API sends it). */
  data?: unknown;
  /** HTTP status, or a fetch error kind ("FETCH_ERROR", "TIMEOUT_ERROR", …) on failure. */
  status?: number | string;
  /** The API's error code, e.g. "read_only" for a View as session (D-017). */
  code?: string;
};

type Translator = {
  success: (ctx: FeedbackContext) => string | null;
  error: (ctx: FeedbackContext) => string | null;
};

let translator: Translator | null = null;

export function setApiFeedback(next: Translator | null) {
  translator = next;
}

export const successMessage = (ctx: FeedbackContext) => translator?.success(ctx) ?? null;
export const errorMessage = (ctx: FeedbackContext) => translator?.error(ctx) ?? null;
