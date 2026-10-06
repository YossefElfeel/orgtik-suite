export class UploadAbortedError extends Error {
  constructor(message = "Upload aborted") {
    super(message);
    this.name = "UploadAbortedError";
  }
}

export function isUploadAbortedError(error: unknown): boolean {
  return (
    error instanceof UploadAbortedError ||
    (typeof error === "object" &&
      error !== null &&
      "error" in error &&
      (error as { error?: string }).error === "Upload aborted")
  );
}
