export interface IJwtPayload {
  sub?: number | string;
  impersonatedBy?: {
    id: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  [key: string]: unknown;
}

export function decodeJwtPayload<T extends IJwtPayload = IJwtPayload>(
  token: string
): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function getImpersonatedByFromToken(token?: string | null) {
  if (!token) return null;
  return decodeJwtPayload(token)?.impersonatedBy ?? null;
}
