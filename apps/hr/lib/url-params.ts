import type { ReadonlyURLSearchParams } from "next/navigation";

type AnySearchParams = ReadonlyURLSearchParams | URLSearchParams;

/**
 * Read a single URL search param, returning `defaultValue` when the key is
 * absent or its value is an empty string.
 *
 * @example
 * const tab = getParam(searchParams, "tab", "all");
 */
export function getParam(
  params: AnySearchParams,
  key: string,
  defaultValue: string = ""
): string {
  const value = params.get(key);
  return value !== null && value !== "" ? value : defaultValue;
}

/**
 * Merge key-value `updates` into the current search params and return a
 * ready-to-use query string (including the leading `?`).
 *
 * Keys whose value is an empty string `""` are **removed** from the URL so
 * default-value filters never pollute the address bar.
 *
 * @example
 * router.replace(pathname + buildParams(searchParams, { tab: "new", page: "" }));
 */
export function buildParams(
  current: AnySearchParams,
  updates: Record<string, string>
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Remove specific keys from the current search params and return a
 * ready-to-use query string (including the leading `?`).
 *
 * @example
 * router.replace(pathname + removeParams(searchParams, ["tab", "page"]));
 */
export function removeParams(
  current: AnySearchParams,
  keys: string[]
): string {
  const next = new URLSearchParams(current.toString());
  for (const key of keys) {
    next.delete(key);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
