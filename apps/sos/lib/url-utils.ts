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

/** True when the configured domain resolves to the same origin as the current page. */
export function isSameOriginDomain(
  domain: string,
  currentOrigin = typeof window !== "undefined" ? window.location.origin : undefined
): boolean {
  if (!currentOrigin) return false;
  const targetOrigin = getOriginFromDomain(domain);
  return targetOrigin !== null && targetOrigin === currentOrigin;
}
