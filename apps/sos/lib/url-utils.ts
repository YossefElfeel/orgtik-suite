/** Normalize a domain/URL string and return its origin, or null if invalid. */
export function getOriginFromDomain(domain: string): string | null {
  if (!domain) return null;
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** True only for this app, including its base path in a Services deployment. */
export function isSameOriginDomain(
  domain: string,
  currentOrigin = typeof window !== "undefined" ? window.location.origin : undefined
): boolean {
  if (!currentOrigin) return false;
  const targetOrigin = getOriginFromDomain(domain);
  if (targetOrigin === null || targetOrigin !== currentOrigin) return false;
  try {
    return new URL(domain).pathname.replace(/\/$/, "") === (process.env.NEXT_PUBLIC_BASE_PATH || "");
  } catch { return false; }
}
