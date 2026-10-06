import type { FieldErrors, FieldValues } from "react-hook-form";

const FIELD_ERROR_KEYS = new Set([
  "message",
  "type",
  "types",
  "ref",
  "root",
]);

/**
 * Returns the first leaf error path (e.g. `name.en`) from RHF errors.
 */
export function getFirstErrorPath(
  errors: FieldErrors<FieldValues> | Record<string, unknown>,
): string | undefined {
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const error = value as Record<string, unknown>;
    const nestedEntries = Object.entries(error).filter(
      ([nestedKey]) => !FIELD_ERROR_KEYS.has(nestedKey),
    );

    if (nestedEntries.length > 0) {
      for (const [nestedKey, nestedValue] of nestedEntries) {
        if (!nestedValue || typeof nestedValue !== "object") {
          continue;
        }

        const nestedPath = getFirstErrorPath({
          [nestedKey]: nestedValue,
        });

        if (nestedPath) {
          return `${key}.${nestedPath}`;
        }
      }
    }

    if ("message" in error || "type" in error || "types" in error) {
      return key;
    }
  }

  return undefined;
}
