// What a change says when it lands or fails, in the reader's language (HR wave, FS-HR-3). The API's
// own messages were shown as they came, in English whatever the reader's language, and twice where
// a dialog also said it. Now baseApi asks this registry, which ApiFeedback fills with translated
// messages once the language is known. Reads never toast: lists show their own error state.

export type FeedbackContext = {
  endpoint: string;
  args: unknown;
  /** The answer's `data` on success (the created or renamed item, when the API sends it). */
  data?: unknown;
  /** HTTP status, or a fetch error kind ("FETCH_ERROR", "TIMEOUT_ERROR", …) on failure. */
  status?: number | string;
  /** The API's error code, when it sends one ("read_only" while viewing as someone, D-017). */
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
