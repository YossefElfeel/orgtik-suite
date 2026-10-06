// Runs a change; its feedback comes from lib/api-feedback (via baseApi), in the reader's language.
// It used to show an English "Please wait..." toast and swallow every error silently. It still
// doesn't throw (callers don't catch), but it now says whether the change went through, so a
// dialog can stay open when it didn't.
export const handleReqWithToaster = async (_title: string, fn: () => Promise<void>): Promise<boolean> => {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
};
